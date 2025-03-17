import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUpLoadUrl = mutation(async(ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");
    return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
    args: {
        caption: v.optional(v.string()),
        storageId: v.id("_storage"),
    },

    handler: async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("User not authenticated");

        const currentUser = await ctx.db.query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();

        if (!currentUser) throw new Error("User not found");

        const imageUrl = await ctx.storage.getUrl(args.storageId);
        if(!imageUrl) throw new Error("Image not found");

        // createPost
        const postId = await ctx.db.insert("posts", {
            userId: currentUser._id,
            imageUrl,
            caption: args.caption,
            storageId: args.storageId,
            likes: 0,
            comments: 0,
        });

        // increament the number of posts for the user +1
        await ctx.db.patch(currentUser._id, {
            posts: currentUser.posts + 1,
        });

        return postId;
    }
});