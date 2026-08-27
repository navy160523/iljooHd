<template>
  <v-col :class="['SubMeunWapperAtivce', { SubMeunWapper: drawer }]">
    <div
      :class="['SubMeunOpen', { SubMeunOpenAtivce: drawer }]"
      @click="handleDrawer"
    >
      <svg-icon name="subMeunBtn"></svg-icon>
    </div>
    <v-navigation-drawer v-model="drawer" disable-resize-watcher temporary>
      <v-list-item
        class="pt-7 pB-14 px-0 firstChild"
        :title="parentTitle"
        :subtitle="parentTitleEn"
      />
      <v-col class="pa-0 sub-menu-list-area">
        <v-list density="compact" nav class="iljoolist">
          <template v-for="first in menuTree" :key="first.menu_id">
            <v-list-group :value="`twoLevel${first.title}`">
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="first.title"
                  append-icon="none"
                  :value="first.menu_id"
                  class="two-Lev"
                  active-class="towLev-V-list-Item-Title-Ative text-primary"
                  @click="toRoute(first)"
                >
                  <template v-slot:prepend>
                    <svg-icon v-if="first.children" name="navArrow"/>
                  </template>
                </v-list-item>
              </template>
              <template v-for="second in first.children" :key="second.menu_id">
                <v-list-group :value="`threeLevel${second.title}`">
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      :title="second.title"
                      :value="second.menu_id"
                      class="three-Lev"
                      active-class="threeLev-V-list-Item-Title-Ative"
                      @click="toRoute(second)"
                    >
                    <template v-slot:append>
                    <svg-icon v-if="second.children" name="navArrow"/>
                  </template>
                    </v-list-item>
                  </template>
                  <template
                    v-for="third in second.children"
                    :key="third.menu_id"
                  >
                    <v-list-group :value="`fourLevel${third.title}`">
                      <template v-slot:activator="{ props }">
                        <v-list-item
                          v-bind="props"
                          :title="third.title"
                          :value="third.menu_id"
                          :append-icon="null"
                          class="four-Lev"
                          active-class="fourLev-V-list-Item-Title-Ative"
                          @click="toRoute(third)"
                        >
                        <template v-slot:prepend>
                    <svg-icon name="navDot"/>
                  </template>
                      </v-list-item>
                      </template>
                    </v-list-group>
                  </template>
                </v-list-group>
              </template>
            </v-list-group>
          </template>
        </v-list>
      </v-col>
    </v-navigation-drawer>
  </v-col>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  isMainMenu: {
    type: Boolean,
    default: false,
  },
  menuList: {
    type: Array,
    default: () => [],
  },
});

const drawer = ref(false);
const handleDrawer = () => {
  drawer.value = !drawer.value;
};
watch(
  () => props.isMainMenu,
  (e) => {
    if (e) {
      drawer.value = false;
    }
  }
);

import { useMenuStore } from "@hiway/stores/menu";
const menuStore = useMenuStore();
const parentTitle = computed(() => menuStore.selected.title);
const parentTitleEn = computed(() => {
  // DB 부재로 인한 하드코딩 추후 수정예정
  //MN04362 hse 경영
  //MN04238 위험성평가
  //MN04236 안전
  //MN04677 안전리스크
  //MN04237 안전지원
  //MN04239 교육/문화/포상
  //MN04930 운영관리
  //HIWAYMN00061 시스템관리
  const parentId = menuStore.selected.id;
  switch (parentId) {
    case "MN04362":
      return "Hse Management";
    case "MN04238":
      return "Risk Assessment";
    case "MN04236":
      return "Safety";
    case "MN04677":
      return "Safety Risk";
    case "MN04237":
      return "Safety Support";
    case "MN04239":
      return "Education/Culture/Awards";
    case "MN04930":
      return "Operation Management";
    case "HIWAYMN00061":
      return "System Management";
    default:
      return "";
  }
});
const menuTree = computed(
  () =>
    props.menuList.find((el) => el.menu_id == menuStore.selected.id)
      ?.children || []
);

import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const toRoute = (menu) => {
  if (menu && !menu.children) {
    router.push({ path: menu.path });
  }
};
</script>

<style lang="scss">
</style>