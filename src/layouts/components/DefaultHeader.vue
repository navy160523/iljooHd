<template>
  <v-app-bar
    :color="homeTop && !isExtended && home ? 'transparent' : 'white'"
    density="default"
    class="default-header"
    :class="[{ home: home }, { transparent: homeTop && !isExtended && home }]"
    extended
    :extension-height="isExtended ? 492 + subMenuMaxLength : 0"
  >
    <template #prepend>
      <!-- <v-sheet width="100%" class="text-center"> -->
      <svg-icon
        v-if="homeTop && !isExtended && home"
        name="HSElogoWhite"
        class="main-logo"
        @click="onBase"
      />
      <svg-icon v-else name="HSElogo" class="main-logo" @click="onBase" />
      <!-- </v-sheet> -->
    </template>
    <v-row no-gutters class="fill-height justify-start flex-nowrap">
      <template v-for="menu in menuList" :key="menu.menu_id">
        <v-btn
          variant="text"
          rounded="0"
          height="100%"
          class="main-nav-btn text-nowrap"
          :class="{ 'selected-btn': selectedMenuId == menu.menu_id }"
          @click="onNavMenu(menu)"
        >
          <!-- 위험성평가 메뉴만 HI-STANDARD로 보이게 변경 -->
          <span v-if="selectedMenuId !== 'MN04238'">
            {{ menu.menu_id !== "MN04238" ? menu.title : "HI-STANDARD" }}
          </span>
          <!-- HI-STANDARD 메뉴 선택시 위험성평가로 보이게 변경 -->
          <span v-if="selectedMenuId === 'MN04238'">
            {{ menu.title }}
          </span>
        </v-btn>
      </template>
    </v-row>
    <template #extension>
      <v-sheet width="1200" min-height="400" height="auto" class="mt-13 d-flex">
        <v-sheet width="285" v-if="selectedMenuTitle !== '위험성평가'">
          <p class="popper-main-title">{{ selectedMenuTitle }}</p>
          <!-- <p class="popper-main-sub-title">개발중입니다.</p> -->
        </v-sheet>
        <v-sheet width="285" v-if="selectedMenuTitle === '위험성평가'">
          <!-- <p class="popper-main-sub-title">개발중입니다.</p> -->
          <img :src="HiStandardLogo" width="190" class="menu_HiStandardLogo" />
          <p class="popper-main-title mt-0">{{ selectedMenuTitle }}</p>
        </v-sheet>
        <v-row no-gutters>
          <template v-for="item in subMenuList" :key="item">
            <v-col class="pa-0 pr-7" cols="4">
              <template
                v-for="(child, child_index) in subMenu[item].list"
                :key="child_index"
              >
                <div
                  :class="[
                    'sub-menu-btn',
                    subMenu[handleMenuName(item)]?.id !== child.menu_id ||
                      'sub-menu-ntn-active',
                  ]"
                  @click="handleSubMenu(child, item)"
                >
                  <span> {{ child.title }} </span>
                  <v-icon v-if="child.children">mdi-chevron-right</v-icon>
                </div>
              </template>
            </v-col>
          </template>
        </v-row>
        <v-sheet width="50">
          <v-icon color="#BCBDBF" style="cursor: pointer" @click="close"
            >mdi-close</v-icon
          >
        </v-sheet>
      </v-sheet>
    </template>
    <template #append>
      <v-sheet width="100%" class="text-right">
        <!-- <NavBarBookmark />
        <NavbarI18n /> -->
        <!-- 테마변경 숨김 -->
        <!-- <NavbarThemeSwitcher /> -->
        <NavBarFullScreen />
        <UserProfile />
        <v-btn 
          link
          to="/SiteMap"
        >사이트맵</v-btn>
        <!-- <SiteMap /> -->
      </v-sheet>
    </template>

    <OPRAJ0010Popup03 ref="noticePopup" />
  </v-app-bar>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue"

import { useMenuStore } from "@hiway/stores/menu"
const menuStore = useMenuStore()
import { useCommonStore } from "@hiway/stores/common"
import NavbarI18n from "@/layouts/components/NavBarI18n.vue"
import NavBarFullScreen from "@/layouts/components/NavBarFullScreen.vue"
import NavBarBookmark from "@/layouts/components/NavBarBookmark.vue"
import UserProfile from "@/layouts/components/UserProfile.vue"
import SiteMap from "@/pages/SiteMap.vue"
import HiStandardLogo from "@/assets/images/HiStandard_logo.png"
import { useLogsStore } from '@hiway/stores/logs'
import { useRoute, useRouter } from "vue-router"
import { commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import OPRAJ0010Popup03 from '@/pages/80_operation/OPR_A/OPRAJ0010Popup03.vue'

const commonStore = useCommonStore()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const noticePopup = ref(null)
const onBase = () => {
  reset(true)
  // sessionStorage.removeItem('parents')
  // sessionStorage.removeItem('parents_id')
  router.push("/")
}

const vm = getCurrentInstance().proxy //다이얼로그관련

// 메인화면에서 첫번째 페이지에 있을때 header 컬러를 transparent로 변경하기 위해 사용
import { useStore } from "vuex"
const store = useStore()
const homeTop = computed(() => {
  return store.state.homeCurrentPage === 0 ? true : false
})

const props = defineProps({
  closeMenu: {
    type: Boolean,
    default: false,
  },
  menuList: {
    type: Array,
    default: () => [],
  },
})
const home = computed(() => {
  return route.name === "index"
})
const emit = defineEmits(["handleMenu"])
import { useTagsStore } from "@hiway/stores/tags"
const tagsStore = useTagsStore()
onMounted(() => {
  if (route.name != "index") {
    const title = sessionStorage.getItem("parents")
    const id = sessionStorage.getItem("parents_id")
    currentMenu.value.title = title
    currentMenu.value.id = id
    menuStore.setSelectedMenu(title, id)
  } else {
    reset(true)
  }
})

const isExtended = ref(false)
watch(
  () => props.closeMenu,
  (e) => {
    if (selectedMenuId.value) {
      menuStore.setSelectedMenu(currentMenu.value.title, currentMenu.value.id)
    } else {
      sessionStorage.removeItem("parents")
      sessionStorage.removeItem("parents_id")
      reset(true)
    }
    isExtended.value = false
    emit("handleMenu", isExtended.value)
    console.log(" 3 ")
  }
)
const close = () => {
  isExtended.value = false
  emit("handleMenu", false)
}

const selectedMenuTitle = computed(() => menuStore.selected.title || null)
const selectedMenuId = computed(() => menuStore.selected.id || null)
const currentMenu = ref({
  title: null,
  id: null,
})
const subMenuMaxLength = computed(() => {
  const first = subMenu.value.first.list.length
  const second = subMenu.value.second.list.length
  const third = subMenu.value.third.list.length
  const length = Math.max(first, second, third)
  return length > 10 ? (length - 10) * 40 : 0
})
const subMenu = ref({
  first: {
    id: "",
    list: [],
  },
  second: {
    id: "",
    list: [],
  },
  third: {
    id: "",
    list: [],
  },
})
const subMenuList = computed(() => Object.keys(subMenu.value))
const onNavMenu = (data) => {
  if (subMenu.value.first.id == data.menu_id && isExtended.value) {
    isExtended.value = false
    subMenu.value.first.id = null
    menuStore.setSelectedMenu(currentMenu.value.title, currentMenu.value.id)
  } else {
    if (subMenu.value.first.id == selectedMenuId.value && !isExtended.value) {
      currentMenu.value.title = selectedMenuTitle.value
      currentMenu.value.id = selectedMenuId.value
    }
    isExtended.value = true
    subMenu.value.first.id = data.menu_id
    menuStore.setSelectedMenu(data.title, data.menu_id)
  }
  subMenu.value.first.list = data.children
  subMenu.value.second.id = null
  subMenu.value.second.list = []
  subMenu.value.third.id = null
  subMenu.value.third.list = []
  emit("handleMenu", isExtended.value)
}
const handleMenuName = (key) => {
  switch (key) {
    case "first":
      subMenu.value.third.id = null
      subMenu.value.third.list = []
      return "second"
    case "second":
      return "third"
    default:
      return null
  }
}
const handleSubMenu = (sub, key) => {
  if (sub.children) {
    subMenu.value[handleMenuName(key)].id = sub.menu_id || null
    subMenu.value[handleMenuName(key)].list = [...sub.children]
  } else {
    if (sub.path !== null) {
      commonStore.loading = true
      reset()
      menuStore.setSelectedMenu(selectedMenuTitle.value, subMenu.value.first.id)
      router.push(sub.path).finally(() => {
        /* 메뉴 화면 이동완료후 로딩완료처리 */
        commonStore.loading = false

        commonRequest('/hse/operation/search01', {
          queryId: 'OPRAJ0010_SEARCH_NOTICE',
          param: {
            CMPNY_DIV: userStore.cmpnyDiv,
            NOTICE_POPUP: 'Y',
            IS_MAIN: 'N',
            NOTICE_MENU: sub.path,
          },
        }).then(res => {
          if(res.ORESULT_CUR.length > 0) {
            noticePopup.value.openPopup({
              isMain: 'N',
              list: res.ORESULT_CUR
            })
          }
        })
      })
    }
  }
}

router.afterEach((to, from, next) => {
  if(to.path === '/'){
    reset(true)
  }
})

const reset = (hardReset) => {
  isExtended.value = false
  if (hardReset) {
    subMenu.value.first.id = null
    subMenu.value.first.list = []
    menuStore.setSelectedMenu(null, null)
  }
  subMenu.value.second.id = null
  subMenu.value.second.list = []
  subMenu.value.third.id = null
  subMenu.value.third.list = []
  emit("handleMenu", isExtended.value)
}
</script>

<style lang="scss" scoped>
.menu_HiStandardLogo {
  margin-left: -10px;
}
</style>
