<script setup>
import { useLayouts } from "@layouts";
import { HorizontalNavLink, HorizontalNavPopper } from "@layouts/components";
import { config } from "@layouts/config";
import { canViewNavMenuGroup } from "@layouts/plugins/casl";
import { isNavGroupActive } from "@layouts/utils";
import { onMounted, reactive, watch } from "vue";

const props = defineProps({
  item: {
    type: null,
    required: true,
  },
  childrenAtEnd: {
    type: Boolean,
    required: false,
    default: false,
  },
  isSubItem: {
    type: Boolean,
    required: false,
    default: false,
  },
});

defineOptions({ name: "HorizontalNavGroup" });

const route = useRoute();
const router = useRouter();
const { dynamicI18nProps, isAppRtl } = useLayouts();
const isGroupActive = ref(false);
const threeLevel = reactive([{}]);
const fourLevel = reactive([{}]);
const threemenuId = ref();
const fourmenuId = ref();
const isActiveHover = ref(false);
const isHoverSubItem = ref(false);
const trueDummy = ref(true);

watch(
  () => route.path,
  () => {
    const isActive = isNavGroupActive(props.item.children, router);
    isGroupActive.value = isActive;
  },
  { immediate: true }
);

const navigateToChild = (path) => {
  if (!path.children) {
    if (path !== null) router.push(path.path);
  }
};

const navIcon = ref("mdi-chevron-right");

const navFilter = (child, level) => {
  if (level == "three") {
    fourLevel.child = [];

    if (child.children) {
      threeLevel.child = [...child.children];
      threemenuId.value = child.menu_id;
    } else {
      threeLevel.child = [];
      threemenuId.value = "";
    }
  } else if (level == "four") {
    if (child.children) {
      fourLevel.child = [...child.children];
      fourmenuId.value = child.menu_id;
    } else {
      fourLevel.child = [];
      fourmenuId.value = "";
    }
  }
};

const navCss = () => {
  isActiveHover.value = true;
};

const navReset = () => {
  isActiveHover.value = false;
  threeLevel.child = [];

  fourLevel.child = [];
  threemenuId.value = [];
  fourmenuId.value = [];
  isHoverSubItem.value = false;
};
</script>

<template>
  <HorizontalNavPopper
    v-if="canViewNavMenuGroup(item)"
    :is-rtl="isAppRtl"
    class="nav-group"
    tag="li"
    content-container-tag="ul"
    :isHovers="isActiveHover"
    :class="[
      {
        activeNavBtn: isGroupActive,
        'children-at-end': childrenAtEnd,
        'sub-item': isSubItem,
        disabled: item.disable,
      },
      {
        activeNavBtn: isActiveHover,
      },
    ]"
    :popper-inline-end="childrenAtEnd"
  >
    <div class="nav-group-label">
      <Component
        :is="config.app.enableI18n ? 'i18n-t' : 'span'"
        v-bind="dynamicI18nProps(item.menu_id, 'span')"
        class="nav-item-title"
        style="font-size: 16px"
      >
      </Component>
    </div>

    <template #reContent>
      <div
        style="
          width: 100%;
          background-color: #fff;
          margin-top: -56px;
          padding-top: 56px;
          padding-bottom: 40px;
        "
        @mouseenter="navCss"
        @mouseleave="navReset"
      >
        <div style="width: 1200px; height: 500px; margin: 0 auto">
          <v-row style="margin-top: 52px">
            <v-col>
              <v-row>
                <span
                  style="
                    font-size: 23px;
                    font-weight: 600;
                    color: #222;
                    margin-top: 8px;
                  "
                >
                  {{ item.title }}</span
                >
              </v-row>
              <v-row style="margin-top: 8px">
                <span
                  style="
                    font-size: 15px;
                    color: #222;
                    font-weight: normal !important;
                  "
                  >개발중입니다.</span
                >
              </v-row>
            </v-col>
            <v-col>
              <v-row>
                <div
                  v-for="child in item.children"
                  :key="child.title"
                  :item="child"
                  @mouseenter="navFilter(child, 'three')"
                  :class="[
                    'navBtn',
                    { navBtnHover: threemenuId === child.menu_id },
                  ]"
                  @click="navigateToChild(child)"
                >
                  <span> {{ child.title }} </span>
                  <v-icon v-if="child.children">{{ navIcon }}</v-icon>
                </div>
              </v-row>
            </v-col>

            <v-col style="margin-left: 30px">
              <v-row>
                <div
                  v-for="child in threeLevel.child"
                  :key="child.title"
                  :item="child"
                  @mouseenter="navFilter(child, 'four')"
                  :class="[
                    'navBtn',
                    { navBtnHover: fourmenuId === child.menu_id },
                  ]"
                  @click="navigateToChild(child)"
                >
                  <span>
                    {{ child.title }}
                  </span>
                  <v-icon v-if="child.children"> {{ navIcon }} </v-icon>
                </div>
              </v-row>
            </v-col>

            <v-col style="margin-left: 30px">
              <v-row>
                <div
                  v-for="child in fourLevel.child"
                  :key="child.title"
                  :item="child"
                  @mouseenter="navFilter(child, 'listChi')"
                  class="navBtn"
                >
                  <span @click="navigateToChild(child)">
                    {{ child.title }}
                  </span>
                  <v-icon v-if="child.children"> {{ navIcon }} </v-icon>
                </div>
              </v-row>
            </v-col>
          </v-row>
        </div>
      </div>
    </template>
  </HorizontalNavPopper>
</template>

<style lang="scss">
.layout-horizontal-nav {
  .nav-group {
    .nav-group-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .popper-content {
      z-index: 1;

      > div {
        overflow-x: hidden;
        overflow-y: auto;
      }
    }
  }
}

.navBtn {
  cursor: pointer;
  width: 100%;
  height: 40px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding-left: 15px;
  line-height: 40px;
  font-size: 15px;
  font-weight: normal !important;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-overflow: ellipsis;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.navBtn:hover {
  background: rgba(232, 237, 255, 0.5);
  color: #1a40c7;
}
.navBtnHover {
  background: rgba(232, 237, 255, 0.5);
  color: #1a40c7;
}

.activeNavBtn {
  font-weight: 700 !important;
  color: #1a40c7 !important;
}
</style>
