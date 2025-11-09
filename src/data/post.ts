import { type CollectionEntry, getCollection } from "astro:content";
import { defaultLang } from "@/i18n/ui";
import type { Lang } from "@/i18n/utils";

/** filter out draft posts based on the environment */
export async function getAllPosts(lang?: Lang): Promise<CollectionEntry<"post">[]> {
	const posts = await getCollection("post", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});

	return lang ? filterPostsByLang(posts, lang) : posts;
}

export function filterPostsByLang(posts: CollectionEntry<"post">[], lang: Lang) {
	return posts.filter((post) => (post.data.lang ?? defaultLang) === lang);
}

export async function getPostsByLang(lang: Lang) {
	return getAllPosts(lang);
}

export function stripLangFromSlug(slug: string, lang: Lang) {
	return slug.startsWith(`${lang}/`) ? slug.slice(lang.length + 1) : slug;
}

/** Get tag metadata by tag name */
export async function getTagMeta(tag: string): Promise<CollectionEntry<"tag"> | undefined> {
	const tagEntries = await getCollection("tag", (entry) => {
		return entry.id === tag;
	});
	return tagEntries[0];
}

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYear(posts: CollectionEntry<"post">[]) {
	return posts.reduce<Record<string, CollectionEntry<"post">[]>>((acc, post) => {
		const year = post.data.publishDate.getFullYear();
		if (!acc[year]) {
			acc[year] = [];
		}
		acc[year]?.push(post);
		return acc;
	}, {});
}

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getAllTags(posts: CollectionEntry<"post">[]) {
	return posts.flatMap((post) => [...post.data.tags]);
}

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTags(posts: CollectionEntry<"post">[]) {
	return [...new Set(getAllTags(posts))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTagsWithCount(posts: CollectionEntry<"post">[]): [string, number][] {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}
