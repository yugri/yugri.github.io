import { getAllPosts, stripLangFromSlug } from "@/data/post";
import { siteConfig } from "@/site.config";
import rss from "@astrojs/rss";

export const GET = async () => {
	const posts = await getAllPosts("uk");

	return rss({
		title: `${siteConfig.title} (Українська стрічка)`,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `posts/${stripLangFromSlug(post.id, "uk")}/`,
		})),
	});
};
