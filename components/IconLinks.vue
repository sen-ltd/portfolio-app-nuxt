<script setup lang="ts">
import type { Entry, Lang } from '../src/types';

const props = defineProps<{
  entry: Entry;
  lang: Lang;
}>();

const qiita = computed(() => props.entry.articles.find((a) => a.platform === 'qiita'));
const devto = computed(() => props.entry.articles.find((a) => a.platform === 'devto'));
const sen = computed(() => props.entry.articles.find((a) => a.platform === 'sen'));
const twitter = computed(() => props.entry.social?.twitter);

// Suppress the whole row if the entry has nothing to link to — matches the
// React reference exactly.
const anyLink = computed(() =>
  Boolean(
    props.entry.github ||
    twitter.value ||
    qiita.value ||
    devto.value ||
    sen.value,
  ),
);
</script>

<template>
  <div v-if="anyLink" class="icon-links">
    <a
      v-if="entry.github"
      :href="entry.github"
      class="icon-link"
      target="_blank"
      rel="noopener"
      title="GitHub"
    >
      <GitHubIcon />
    </a>
    <a
      v-if="twitter"
      :href="twitter"
      class="icon-link"
      target="_blank"
      rel="noopener"
      title="X (Twitter)"
    >
      <XIcon />
    </a>
    <a
      v-if="qiita"
      :href="qiita.url"
      class="icon-link"
      target="_blank"
      rel="noopener"
      title="Qiita"
    >
      <QiitaIcon />
    </a>
    <a
      v-if="devto"
      :href="devto.url"
      class="icon-link"
      target="_blank"
      rel="noopener"
      title="dev.to"
    >
      <DevToIcon />
    </a>
    <a
      v-if="sen && !qiita"
      :href="sen.url"
      class="article-badge"
      target="_blank"
      rel="noopener"
      :title="lang === 'ja' ? 'JA 記事' : 'Japanese article'"
    >
      {{ lang === 'ja' ? '記事' : 'JA' }}
    </a>
  </div>
</template>
