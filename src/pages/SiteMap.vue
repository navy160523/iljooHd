<!--
  화면명 : 사이트맵
  화면개요 : 메뉴 전체 화면을 보여준다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const highlight = ref('')
const highIdx = ref(0)
const router = useRouter()
const menuStore = useMenuStore()

const highlightList = reactive({
  list: [],
})

const searchTerm = reactive({
  term: '',
})

// 페이지 이동
const pageMove = (menu) => {
  if(menu.href != '' && menu.href != null) router.push(menu.href)
}

// 상단 레벨1 메뉴들을 누르면 하위 컨텐츠에 스크롤해준다.
const scrollMove = (menu) => {
  document.getElementById(menu.menu_id).scrollIntoView({ behavior: 'smooth' })
}

// 검색 단어 강조
const setHighlight = (word) => {
  if(highlight.value != '') {
    const regex = new RegExp(`(${highlight.value})`, 'gi')
    if(highlightList.list.length == 0) return word
    if(highlightList.list[highIdx.value].mnu_nm == word) return word.replace(regex, '<span class="highlight-now">$1</span>')
    else return word.replace(regex, '<span class="highlight">$1</span>')
  }
  return word 
}

const setHighList = (menu) => {
  if(menu.mnu_nm.indexOf(highlight.value) >= 0) highlightList.list.push(menu)
  if(menu.children == null) return
  for(var mn of menu.children) {
    setHighList(mn)
  }
}

// 마우스 hover 시 path가 없는것은 안되도록
const isPath = (path) => {
  if(path.path != null && path.path != '') return true
  return false
}

const searchWord = () => {
  if(highlight.value == searchTerm.term) {
    if(highIdx.value == highlightList.list.length - 1) {
      highIdx.value = 0
    } else highIdx.value += 1
  } else {
    highlightList.list = []
    highlight.value = searchTerm.term
    for(var menu of menuStore.treeMenus) {
      setHighList(menu)
    }
    highIdx.value = 0
  }
  if(highlightList.list.length == 0) return
  document.getElementById(highlightList.list[highIdx.value].menu_id).scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  searchTerm.term = ''
  highlight.value = ''
  highlightList.list = []
})
</script>
<template>
  <v-sheet color="white" class="siteMap">
    <div class="search-menu">
      <v-text-field 
        v-model="searchTerm.term" 
        type="text"
        class="siteSearch"
        color="white" 
        flat
        append-inner-icon="mdi-magnify"
        @click:appendInner="searchWord"
        @keypress.enter="searchWord"
      >
      </v-text-field> 
      <ul class="siteMapNav">
        <!-- 1단계 -->
        <!-- href="menu001" ==> id="menu001"로 이동 -->
        <li v-for="menu in menuStore.treeMenus" :key="menu.menu_id">
          <v-btn color="primary" variant="text" @click="scrollMove(menu)">{{ menu.mnu_nm }}</v-btn>
        </li>
      </ul>
    </div>
    <div class="content"> 
      <section :id="menu1.menu_id" class="siteLevel1" v-for="menu1 in menuStore.treeMenus" :key="menu1.menu_id">
        <!-- 1단계 -->
        <div class="title" @click="pageMove(menu1)"><span v-html="setHighlight(menu1.mnu_nm)"></span></div>
          <div>
            <div :id="menu2.menu_id" class="siteLevel2" v-for="menu2 in menu1.children" :key="menu2.menu_id">
              <!-- 2단계 -->
              <div variant="text" @click="pageMove(menu2)"><span v-html="setHighlight(menu2.mnu_nm)" :class="{ hover_underline: isPath(menu2)}"></span></div>
              <div>
                <div :id="menu3.menu_id" class="siteLevel3" v-for="menu3 in menu2.children" :key="menu3.menu_id">
                  <!-- 3단계 -->
                  <div color="#222" variant="text" @click="pageMove(menu3)"><span v-html="setHighlight(menu3.mnu_nm)" :class="{ hover_underline: isPath(menu3)}"></span></div> 
                  <div class="siteLevel4">
                    <div :id="menu4.menu_id" v-for="menu4 in menu3.children" :key="menu4.menu_id">
                      <div color="#222" variant="text"  @click="pageMove(menu4)"> <span v-html="setHighlight(menu4.mnu_nm)" :class="{ hover_underline: isPath(menu4)}"></span> </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </v-sheet>
</template>
<style lang="scss">
.siteMap {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 125px); /* Viewport Height 설정 */
  overflow: hidden; /* 전체 페이지에 스크롤이 생기지 않도록 함 */
  .v-btn {
    justify-content: flex-start;
    font-weight: 600;
    padding: 10px 0 !important;
    .v-btn__overlay {
      opacity: 0;
    }
    .v-btn__content {
      border-bottom: 1px solid transparent;
      transition: all 0.4s;
    }
    &:hover .v-btn__content {
      border-bottom: 1px solid currentColor;
    }
  }
}
.search-menu {
  flex-shrink: 0; /* 헤더 높이를 고정 */
}
.content {
  overflow-y: auto; /* 세로 스크롤 추가 */
  flex: 1; /* 남은 공간 모두 사용 */
}
.siteSearch {
  max-width: 800px;
  margin: 0 auto;
  border-bottom: 2px solid #222;
  padding: 15px;
  margin-top: 20px;
}
.search-button {
  cursor: pointer;
}
.highlight {
  background-color: yellow;
}
.highlight-now {
  background-color: #ff6969;
}
.siteMapNav,
.siteLevel1 {
  max-width: 1400px;
  margin: 0 auto;
}
.siteMapNav {
  list-style-type: none;
  border-radius: 3px;
  background: #f8f9fc;
  display: flex;
  justify-content: space-between;
  padding: 20px 110px;
  margin-top: 40px;
}
.siteLevel1 {
  padding-top: 32px;
  scroll-margin-top: 80px;
  &:last-child {
    padding-bottom: 80px;
  }
  .title {
    color: #222;
    font-size: 23px;
    font-weight: 600;
    line-height: normal;
    border-bottom: 2px solid #000;
    padding-bottom: 20px;
  }
  .siteLevel2,
  .siteLevel3,
  .siteLevel4 {
    display: grid;
  }
  .siteLevel2 {
    grid-template-columns: 1fr 4fr;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 0;
    font-weight: 700;
    color: #2977ff;
    .siteLevel3 {
      grid-template-columns: 1fr 3fr;
      padding: 10px 0;
      font-size: 15px;
      font-weight: 700;
      color: #1f2632;
      &:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      &:first-child {
        padding-top: 0px;
      }
      &:last-child {
        padding-bottom: 0px;
      }
      &:only-child {
        padding-top: 0px;
        padding-bottom: 0px;
      }
      &.noLevel4 {
        grid-template-columns: repeat(4, 1fr);
      }
      .siteLevel4 {
        grid-template-columns: repeat(3, 1fr);
        justify-content: flex-start;
        font-weight: 400;
        font-size: 14px;
      }
    }
  }

  /* 기본 스타일 설정 */
  .hover-underline {
    display: inline-block;
  }

  /* 마우스를 올렸을 때 밑줄 추가 */
  .hover_underline:hover {
    text-decoration: underline;
    cursor: pointer;
  }
}
</style>
