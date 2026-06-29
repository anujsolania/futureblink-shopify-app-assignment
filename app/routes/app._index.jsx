import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { connectMongoDB } from "../mongodb.server";
import { Announcement } from "../models/announcement.model";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // 1. Fetch current metafield from Shopify
  const response = await admin.graphql(`
    query {
      shop {
        metafield(namespace: "my_app", key: "announcement") {
          value
        }
      }
    }
  `);
  const data = await response.json();
  const currentAnnouncement = data?.data?.shop?.metafield?.value || "";

  // 2. Fetch audit history from MongoDB
  let logs = [];
  let dbError = null;
  try {
    await connectMongoDB();
    const logsRaw = await Announcement.find().sort({ timestamp: -1 }).limit(10).lean();
    logs = logsRaw.map(log => ({
      id: log._id.toString(),
      text: log.text,
      timestamp: log.timestamp.toISOString()
    }));
  } catch (error) {
    console.error("Error fetching audit logs from MongoDB:", error);
    dbError = "Could not connect to MongoDB database. History is currently unavailable.";
  }

  return { currentAnnouncement, logs, dbError };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const announcementText = formData.get("announcementText");

  if (!announcementText) {
    return { success: false, error: "Announcement text cannot be empty" };
  }

  // 1. Save to MongoDB for Audit History
  try {
    await connectMongoDB();
    await Announcement.create({ text: announcementText });
  } catch (error) {
    console.error("Error saving announcement to MongoDB:", error);
    // Do not fail the entire operation if only MongoDB log fails, but log it
  }

  // 2. Get Shop ID
  const shopQuery = await admin.graphql(`
    query {
      shop {
        id
      }
    }
  `);
  const shopData = await shopQuery.json();
  const shopId = shopData?.data?.shop?.id;

  if (!shopId) {
    return { success: false, error: "Could not retrieve Shop ID" };
  }

  // 3. Sync to Shopify Metafield
  const metafieldResponse = await admin.graphql(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: "my_app",
          key: "announcement",
          value: announcementText,
          type: "single_line_text_field"
        }
      ]
    }
  });

  const resJson = await metafieldResponse.json();
  const userErrors = resJson?.data?.metafieldsSet?.userErrors;

  if (userErrors && userErrors.length > 0) {
    return { success: false, error: userErrors[0].message };
  }

  return { success: true, message: "Announcement updated!", currentText: announcementText };
};

export default function Index() {
  const { currentAnnouncement, logs: initialLogs, dbError } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [inputText, setInputText] = useState(currentAnnouncement);

  const isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message);
    } else if (fetcher.data?.error) {
      shopify.toast.show(`Error: ${fetcher.data.error}`);
    }
  }, [fetcher.data, shopify]);

  const activeAnnouncement = fetcher.data?.success ? fetcher.data.currentText : currentAnnouncement;

  return (
    <s-page heading="Announcement Banner Settings">
      <s-section heading="Manage Announcement Banner">
        <s-paragraph>
          Update the global banner text displayed across your online storefront.
        </s-paragraph>
        <fetcher.Form method="POST">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="announcementText"
              label="Announcement Text"
              value={inputText}
              onChange={(e) => setInputText(e.currentTarget.value)}
              autocomplete="off"
              placeholder="e.g. Free shipping on orders over $50!"
            />
            <s-button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Announcement"}
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>

      <s-section heading="Active Banner Preview">
        <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
          {activeAnnouncement ? (
            <div style={{
              padding: "12px",
              background: "#008060",
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "14px",
              borderRadius: "4px"
            }}>
              {activeAnnouncement}
            </div>
          ) : (
            <s-text tone="subdued">No active announcement text set.</s-text>
          )}
        </s-box>
      </s-section>

      <s-section heading="Audit History (MongoDB Logs)">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          {dbError && (
            <div style={{ marginBottom: "12px", color: "#bf0711", fontSize: "14px" }}>
              ⚠️ {dbError}
            </div>
          )}
          {initialLogs && initialLogs.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                  <th style={{ padding: "8px 0", fontWeight: "600" }}>Announcement Text</th>
                  <th style={{ padding: "8px 0", fontWeight: "600" }}>Saved At</th>
                </tr>
              </thead>
              <tbody>
                {initialLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                    <td style={{ padding: "8px 0" }}>{log.text}</td>
                    <td style={{ padding: "8px 0" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <s-text tone="subdued">No previous announcements found in audit history.</s-text>
          )}
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
