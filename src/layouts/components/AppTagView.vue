<template>
  <div class="py-1 full app-tag"
    style="position: relative;">
    <div class="mx-auto pr-6">
      <VSlideGroup ref="appTagSlideGroup" show-arrows>
        <draggable
          v-model="tagsStore.visitedViews"
          item-key="name"
        >
          <template #item="{ element }">
            <VChip
              ref="tags"
              size="small"
              closable
              link
              class="ma-1"
              :class="
                isActive(element)
                  ? 'bg-chipActive text-primary'
                  : 'bg-chipBase text-textCaption'
              "
              draggable
              :to="{ path: element.path, query: element.query, fullPath: element.fullPath }"
              @click="onTag(element)"
              @click:close="closeTag($event, element)"
            >
              <!-- <VIcon>{{ getMenuIcon(tag) }}</VIcon>             -->
              <!-- <svg-icon name="chipCircle" class="mR-4" /> -->
              {{ $t(getMenuTitle(element)) }}
            </VChip>
          </template>
        </draggable>
        
        <v-btn
          height="24"
          width="80"
          color="transparent"
          class="d-flex align-center"
          @click.stop="closeAllTag"
        >
          모두닫기
          <VIcon class="ml-1 mr-n1">
            mdi-close-circle-outline
          </VIcon>
        </v-btn>
      </VSlideGroup>
    </div>
  </div>
</template>

<script setup>
import { watch } from "vue";
import { useTagsStore } from "@hiway/stores/tags";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { config } from "@layouts/config";
import { useMenuStore } from "@hiway/stores/menu";
const menuStore = useMenuStore();
import { find } from "lodash-es";
import draggable from 'vuedraggable';

const route = useRoute();
const router = useRouter();
const tagsStore = useTagsStore();
const { t } = useI18n();
const vm = getCurrentInstance().proxy;

const getMenuTitle = (tag) => {
  const targetMenu = find(menuStore.menus, { href: tag.path });

  return !targetMenu ? tag.name : targetMenu.menu_id;
};

const getMenuIcon = (tag) => {
  const targetMenu = find(menuStore.menus, { href: tag.path });

  return !targetMenu || !targetMenu.icon_path
    ? config.verticalNav.defaultNavItemIconProps.icon
    : targetMenu.icon_path;
};

const isActive = (tag) => {
  return tag.path === router.currentRoute.value.path;
};

const onTag = (tag) => {
  const targetMenu = find(menuStore.menus, { href: tag.path });
  const setParentsMenu = (target) => {
    if (target.menulevel > 1) {
      const menu = find(menuStore.menus, { menu_id: target.prnts_menu_id });
      setParentsMenu(menu);
    } else {
      menuStore.setSelectedMenu(target.title, target.menu_id);
    }
  };
  setParentsMenu(targetMenu);
};

const closeTag = (event, tag) => {
  event.preventDefault();
  tagsStore.deleteVisitedView(tag);
  tagsStore.deleteCachedView(tag);
  if (isActive(tag)) {
    const latestView = tagsStore.visitedViews.slice(-1)[0];
    if (latestView) {
      onTag(latestView);
      router.push({
        path: latestView.path,
        query: latestView.query,
        fullPath: latestView.fullPath,
      });
    } else {
      menuStore.setSelectedMenu(null, null);
      router.push("/");
    }
  }
};

const closeAllTag = () => {
  vm.$swal({
    title: t('열려진 메뉴를 모두 닫으시겠습니까?'),
    showCancelButton: true,
  }).then(res => {
    if(res.isConfirmed) {
      tagsStore.reset();
      router.push("/");
    }
  })
};

watch(() => route.path, () => {
  if(route.path !== '/') {
    tagsStore.addVisitedView(route, t)
    tagsStore.addCachedView(route)
    onTag(router.currentRoute.value)
  } else {
    menuStore.setSelectedMenu(null, null)
  }
  
}, { immediate: true })
</script>
