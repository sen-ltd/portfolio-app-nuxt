<script setup lang="ts">
import type { Lang } from './src/types';
import type { FilterState, SortKey } from './src/filter';
import { filterAndSort } from './src/filter';
import { loadPortfolioData } from './src/data';
import { MESSAGES, detectDefaultLang } from './src/i18n';

// ---- URL query sync -------------------------------------------------------

function readLangFromQuery(): Lang | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  const v = q.get('lang');
  return v === 'ja' || v === 'en' ? v : null;
}

function readQuery(): FilterState {
  if (typeof window === 'undefined') return defaultFilter();
  const q = new URLSearchParams(window.location.search);
  return {
    query: q.get('q') ?? '',
    category: q.get('category') ?? 'all',
    stack: q.get('stack') ?? 'all',
    stage: q.get('stage') ?? 'all',
    sort: (q.get('sort') as SortKey) ?? 'number',
  };
}

function defaultFilter(): FilterState {
  return { query: '', category: 'all', stack: 'all', stage: 'all', sort: 'number' };
}

function writeQuery(filter: FilterState, lang: Lang) {
  if (typeof window === 'undefined') return;
  const q = new URLSearchParams();
  if (filter.query) q.set('q', filter.query);
  if (filter.category !== 'all') q.set('category', filter.category);
  if (filter.stack !== 'all') q.set('stack', filter.stack);
  if (filter.stage !== 'all') q.set('stage', filter.stage);
  if (filter.sort !== 'number') q.set('sort', filter.sort);
  q.set('lang', lang);
  const qs = q.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

// ---- Reactive state -------------------------------------------------------

const lang = ref<Lang>(readLangFromQuery() ?? detectDefaultLang());
const filter = ref<FilterState>(readQuery());
const portfolioData = ref<Awaited<ReturnType<typeof loadPortfolioData>> | null>(null);
const loadError = ref<string | null>(null);

const m = computed(() => MESSAGES[lang.value]);

const visible = computed(() => {
  if (!portfolioData.value) return [];
  return filterAndSort(portfolioData.value.entries, filter.value, lang.value);
});

const stackMap = computed(() => {
  const map = new Map<string, { id: string; name: string; color: string }>();
  if (portfolioData.value) for (const s of portfolioData.value.stacks) map.set(s.id, s);
  return map;
});

const stageMap = computed(() => {
  const map = new Map<string, { id: string; icon: string; name: { ja: string; en: string } }>();
  if (portfolioData.value) for (const s of portfolioData.value.stages) map.set(s.id, s);
  return map;
});

const categoryMap = computed(() => {
  const map = new Map<string, { id: string; name: { ja: string; en: string } }>();
  if (portfolioData.value) for (const c of portfolioData.value.categories) map.set(c.id, c);
  return map;
});

// Sync query string on filter/lang change
watch([filter, lang], ([f, l]) => {
  writeQuery(f, l);
}, { deep: true });

function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
  filter.value = { ...filter.value, [key]: value };
}

// Load data on mount
onMounted(async () => {
  try {
    portfolioData.value = await loadPortfolioData();
  } catch (e) {
    loadError.value = String(e);
  }
});
</script>

<template>
  <div>
    <div v-if="loadError" class="state state-error">
      {{ m.errorLabel }}: {{ loadError }}
    </div>

    <div v-else-if="!portfolioData" class="state state-loading">
      {{ m.loadingLabel }}
    </div>

    <template v-else>
      <header class="site-header">
        <div class="header-top">
          <a class="home-link" href="/">{{ m.homeLabel }}</a>
          <div class="lang-switch">
            <label>{{ m.langLabel }}</label>
            <select :value="lang" @change="lang = ($event.target as HTMLSelectElement).value as Lang">
              <option value="ja">JA</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
        <h1>{{ m.title }}</h1>
        <p class="subtitle">{{ m.subtitle }}</p>
        <p class="meta">
          {{ m.totalCount(portfolioData.entries.length) }}&nbsp;·&nbsp;{{ m.lastUpdated(portfolioData.updatedAt) }}&nbsp;·
          {{ m.framework }}
        </p>
      </header>

      <main>
        <section class="controls">
          <input
            type="text"
            class="search"
            :placeholder="m.searchPlaceholder"
            :value="filter.query"
            @input="updateFilter('query', ($event.target as HTMLInputElement).value)"
          />

          <div class="filters">
            <label class="select-wrap">
              <span class="select-label">{{ m.categoryLabel }}</span>
              <select :value="filter.category" @change="updateFilter('category', ($event.target as HTMLSelectElement).value)">
                <option value="all">{{ m.allLabel }}</option>
                <option v-for="c in portfolioData.categories" :key="c.id" :value="c.id">
                  {{ c.name[lang] }}
                </option>
              </select>
            </label>

            <label class="select-wrap">
              <span class="select-label">{{ m.stackLabel }}</span>
              <select :value="filter.stack" @change="updateFilter('stack', ($event.target as HTMLSelectElement).value)">
                <option value="all">{{ m.allLabel }}</option>
                <option v-for="s in portfolioData.stacks" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </label>

            <label class="select-wrap">
              <span class="select-label">{{ m.stageLabel }}</span>
              <select :value="filter.stage" @change="updateFilter('stage', ($event.target as HTMLSelectElement).value)">
                <option value="all">{{ m.allLabel }}</option>
                <option v-for="s in portfolioData.stages" :key="s.id" :value="s.id">
                  {{ s.icon }} {{ s.name[lang] }}
                </option>
              </select>
            </label>

            <label class="select-wrap">
              <span class="select-label">{{ m.sortLabel }}</span>
              <select :value="filter.sort" @change="updateFilter('sort', ($event.target as HTMLSelectElement).value as SortKey)">
                <option value="number">{{ m.sortNumber }}</option>
                <option value="newest">{{ m.sortNewest }}</option>
                <option value="oldest">{{ m.sortOldest }}</option>
                <option value="name">{{ m.sortName }}</option>
              </select>
            </label>
          </div>

          <div class="result-count">
            {{ m.filteredCount(visible.length, portfolioData.entries.length) }}
          </div>
        </section>

        <p v-if="visible.length === 0" class="empty">{{ m.noResults }}</p>

        <section v-else class="grid">
          <article v-for="entry in visible" :key="entry.slug" class="card">
            <div class="card-head">
              <span class="entry-number">#{{ String(entry.number).padStart(3, '0') }}</span>
              <template v-if="stageMap.get(entry.stage)">
                <span class="stage-badge">
                  {{ stageMap.get(entry.stage)!.icon }} {{ stageMap.get(entry.stage)!.name[lang] }}
                </span>
              </template>
            </div>
            <h2 class="entry-name">{{ entry.name[lang] }}</h2>
            <div v-if="categoryMap.get(entry.category)" class="category">
              {{ categoryMap.get(entry.category)!.name[lang] }}
            </div>
            <p class="pitch">{{ entry.pitch[lang] }}</p>
            <div class="tech-row">
              <span
                v-for="techId in entry.tech"
                :key="techId"
                class="tech-chip"
                :style="{ borderLeftColor: stackMap.get(techId)?.color ?? '#272b35' }"
              >
                {{ stackMap.get(techId)?.name ?? techId }}
              </span>
            </div>
            <div class="actions">
              <a
                v-if="entry.demo"
                :href="entry.demo"
                class="action-btn primary"
                target="_blank"
                rel="noopener"
              >
                ↗ {{ m.demoLabel }}
              </a>
              <IconLinks :entry="entry" :lang="lang" />
              <span v-if="entry.testCount && entry.testCount > 0" class="tests-badge">
                {{ m.testsLabel(entry.testCount) }}
              </span>
            </div>
          </article>
        </section>
      </main>

      <footer class="site-footer">
        <span>SEN 合同会社 · Nuxt 3 + TypeScript (Composition API + Nitro) · entry 025</span>
      </footer>
    </template>
  </div>
</template>
