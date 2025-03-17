import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";

const http = httpRouter();

// 1 - Create a new route that listens for POST requests on /clerk-webhook
// 2 - Make sure that the webhook event is coming from Clerk by verifying the signature
// 3 - If the event is a user.created event, create a new user in the database

http.route({
    path:"/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

        if (!webhookSecret) {
            throw new Error("Missing Clerk Webhook Secret. Please set CLERK_WEBHOOK_SECRET in your .env");
        }

        //Check headers
        const svix_id = request.headers.get("svix-id");
        const svix_signature = request.headers.get("svix-signature");
        const svix_timestamp = request.headers.get("svix-timestamp");

        if (!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("Missing headers", { status: 400 });
        }

        const payload = await request.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let evt:any;
        
        // Verify the webhook
        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-signature": svix_signature,
                "svix-timestamp": svix_timestamp
            }) as any;
        } catch (err) {
            console.log("Error verifying webhook", err);
            return new Response("Invalid webhook signature", { status: 400 });
        }

        const eventType = evt.type;

        if(eventType === "user.created") {
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;

            // Validate email_addresses and ensure it contains at least one valid email
            if (!email_addresses || email_addresses.length === 0) {
                console.log("No email addresses found in email_addresses", email_addresses);
                return new Response("Error: No email addresses found", { status: 400 });
            }

            const email = email_addresses[0]?.email_address;
            if (!email || !email.includes("@")) {
                console.log("Invalid email found in email_addresses", email_addresses);
                return new Response("Error: Invalid email found", { status: 400 });
            }

            const name = `${first_name || ""} ${last_name || ""}`.trim();

            try {
                await ctx.runMutation(api.users.createUser, {
                    email,
                    fullname: name,
                    image: image_url,
                    clerkId: id,
                    username: email.split("@")[0],
                })
            } catch (err) {
                console.log("Error creating user", err);
                return new Response("Error creating user", { status: 500 });
            }
        }

        return new Response("Webhook processed successfully", { status: 200 });
    })
})

export default http;