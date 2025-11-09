import type { CollectionEntry } from "astro:content";
import type { GetStaticPaths, GetStaticPathsOptions, Page } from "astro";
import { getAllPosts, getUniqueTags, stripLangFromSlug } from "@/data/post";
import { collectionDateSort } from "@/utils/date";
import type { Lang } from "@/i18n/utils";
import { defaultLang } from "@/i18n/ui";

const MAX_POSTS_PER_PAGE = 10;
const MAX_TAGS = 7;
const MAX_PINNED_POSTS = 3;

export type PostsPageProps = {
	page: Page<CollectionEntry<"post">>;
	uniqueTags: string[];
	pinnedPosts: CollectionEntry<"post">[];
	lang: Lang;
	shouldRedirectToDefault?: boolean;
};

export function createPostsGetStaticPaths(lang: Lang): GetStaticPaths {
	return async ({ paginate }: GetStaticPathsOptions) => {
		const localizedPosts = (await getAllPosts(lang)).sort(collectionDateSort);
		const uniqueTags = getUniqueTags(localizedPosts).slice(0, MAX_TAGS);
		const pinnedPosts = localizedPosts
			.filter((p) => p.data.pinned)
			.slice(0, MAX_PINNED_POSTS);

		return paginate(localizedPosts, {
			pageSize: MAX_POSTS_PER_PAGE,
			props: {
				lang,
				pinnedPosts,
				shouldRedirectToDefault: lang !== defaultLang && localizedPosts.length === 0,
				uniqueTags,
			},
		});
	};
}

export type PostDetailProps = {
	post: CollectionEntry<"post">;
};

export function createPostDetailPaths(lang: Lang): GetStaticPaths {
	return async () => {
		const localizedPosts = await getAllPosts(lang);
		return localizedPosts.map((post) => ({
			params: { slug: stripLangFromSlug(post.id, post.data.lang ?? defaultLang) },
			props: { post },
		}));
	};
}
