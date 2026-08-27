<script setup>
import EventHandler from "@hiway/utils/eventHandler"
import { onMounted, reactive } from "vue"
import router from "@/router"

import weatherPopUp from "@/pages/99_indexPopUp/weatherPopUp.vue"
import { value } from "lodash-es"
import { useMenuStore } from "@hiway/stores/menu"
import NoticeInfo from "@/layouts/components/NoticeInfo.vue"
import dayjs from "dayjs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonRequest } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"

//공지사항 관련 변수 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const noticeArray = reactive([]) //보여줘야할 공지사항을 저장하고 있는 배열
const notShowNoticeNo = reactive([]) //띄운 공지사항중에 오늘하루 보지않기 체크하고 닫기 누른 공지사항 번호 저장하는 배열
const noticeDialog = ref(false) //공지사항 dialog vmodel
const dialogHeight = ref(1000)
const oneDayCookieCheckBoxValue = ref(null) //하루동안 이 창을 열지않음 체크박스 v-model
const threeDayCookieCheckBoxValue = ref(null) // 3일 동안 이 창을 열지않음 체크박스 v-model

let showNoticeFlag = ref(null)

const searchNoticeParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_POPUP: "Y",
})
//공지사항 관련 변수 끝

// 공지사항 관련 로직 시작
const searchNotice = () => {
  //팝업여부 Y 공지사항 조회
  //new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).showMessage(false).run()

  commonRequest("/hse/operation/search01", {
    queryId: "OPRAJ0010_MAIN_NOTICE_SEARCH_01",
    param: searchNoticeParam,
  })
    .then((res) => {
      for (let i = 0; i < res.ORESULT_CUR.length; i++) {
        if (notShowNoticeNo.includes(res.ORESULT_CUR[i].NOTICE_NO.toString()) === false) {
          noticeArray.push(res.ORESULT_CUR[i])
        }
      }
    })
    .finally(() => {
      if (noticeArray.length > 0) {
        noticeDialog.value = true
      }
    })
}

const searchData = () => {
  return commonRequest("/hse/operation/search01", {
    queryId: "OPRAJ0010_MAIN_NOTICE_SEARCH_01",
    param: searchNoticeParam,
  })
}

const afterSearch = (res) => {
  for (let i = 0; i < res.ORESULT_CUR.length; i++) {
    if (notShowNoticeNo.includes(res.ORESULT_CUR[i].NOTICE_NO.toString()) === false) {
      noticeArray.push(res.ORESULT_CUR[i])
    }
  }
  noticeDialog.value = true
}

const getCookie = () => {
  // 쿠키 가져와서 파싱 후 보여주지 말아야할 공지사항 번호 추출
  let expireCookies = document.cookie
  showNoticeFlag.value = expireCookies.includes("NOTICE-EXPIRE-COOKIE") ? true : false
  // let splitedCookies = expireCookies.split(";")
  // for (let i = 0; i < splitedCookies.length; i++) {
  //   let no = splitedCookies[i].split("=")
  //   notShowNoticeNo.push(no[1]) //쿠키가 생성되어서 보여주지 말아야할 공지사항 번호를 담고있는 배열
  // }
}

const setCookie = () => {
  //쿠키생성
  if (oneDayCookieCheckBoxValue.value === "Y") {
    let date = new Date(Date.now() + 86400e3)
    let expireDate = "expires=" + date.toUTCString() //쿠키만료시간 현재시각 + 1일
    let cookieName = "NOTICE-EXPIRE-COOKIE" + "="
    let cookieValue = "expire" + ";"
    document.cookie = cookieName + cookieValue + expireDate
  }
  if (threeDayCookieCheckBoxValue.value === "Y") {
    let date = new Date(Date.now() + 86400e3 * 3)
    let expireDate = "expires=" + date.toUTCString() //쿠키만료시간 현재시각 + 3일
    let cookieName = "NOTICE-EXPIRE-COOKIE" + "="
    let cookieValue = "expire" + ";"
    document.cookie = cookieName + cookieValue + expireDate
  }
}

const closeNoticeInfo = () => {
  if (oneDayCookieCheckBoxValue.value === "Y") {
    setCookie()
  }
  if (threeDayCookieCheckBoxValue.value === "Y") {
    setCookie()
  }
  noticeDialog.value = false
}

const mouseover = () => {
  const closeButton = document.getElementById("closeButton")
  closeButton.style.cursor = "pointer"
}

//체크박스 감지
watch(
  () => oneDayCookieCheckBoxValue.value,
  (newValue, oldValue) => {
    if (newValue === "Y") {
      threeDayCookieCheckBoxValue.value = "N"
    }
  }
)
watch(
  () => threeDayCookieCheckBoxValue.value,
  (newValue, oldValue) => {
    if (newValue === "Y") {
      oneDayCookieCheckBoxValue.value = "N"
    }
  }
)

//공지사항 관련 로직 끝

// watch(searchAuto, (newValue) => {
//   const searchText = newValue.toLowerCase()
//   const filteredItems = autoSearchContents.filter((x) => x.mnu_nm.includes(searchText))

//   if (filteredItems.length !== 0) {
//     autoSearchResult.value = filteredItems.map((item) => {
//       const text = item.mnu_nm
//       item.highlightedText = text.replace(
//         new RegExp(searchText, "gi"),
//         `<span style="color:#1A40C7">${searchText}</span>`
//       )
//       return item
//     })
//   } else {
//     autoSearchResult.value = [{ highlightedText: "검색된 결과가 없습니다.", isNone: true }]
//   }
// })

onMounted(() => {
  //모든 컴포넌트가 마운트 된후에 공지사항 로직 시작
  vm.$nextTick(() => {
    getCookie()
    if (showNoticeFlag.value === false) {
      searchNotice()
    }
  })
})

//  메인 새로 추가본

// MAIN Carousel
import mainCarouselImg1 from "@/assets/images/main/Carousel1.png"
import mainCarouselImg2 from "@/assets/images/main/Carousel2.png"
import mainCarouselImg3 from "@/assets/images/main/Carousel3.png"

const imgData = ref([
  {
    img: "mainCarouselImg1",
    slogan:
      '<span class="font-weight-bold">미래를</span> 향해 <span class="font-weight-bold">안전</span>을 <span class="font-weight-bold">항해</span>하는 <span class="font-weight-bold">HD 현대</span>',
  },
  { img: "mainCarouselImg2", slogan: "slogan2" },
  { img: "mainCarouselImg3", slogan: "slogan3" },
])
const CarouselImg = {
  mainCarouselImg1: mainCarouselImg1,
  mainCarouselImg2: mainCarouselImg2,
  mainCarouselImg3: mainCarouselImg3,
}

// Select
const selected = ref("A")
const selectList = ref([
  { id: "A", text: "전체" },
  { id: "M", text: "메뉴" },
  { id: "F", text: "자료실" },
])
const onSelected = (param) => {
  selected.value = param.value
}

// Search
const search = ref("")
const onSearch = () => {
  // 검색 기능
}

// Notice
const NoticeList = ref([
  {
    date: "2023.11.21",
    cardTitle: "소규모합병을 위한 기준일 설정 공고",
  },
  {
    date: "2023.11.20",
    cardTitle: "제 4기 결산공고",
  },
  {
    date: "2023.11.19",
    cardTitle: "HD현대중공업 11월 공지",
  },
  {
    date: "2023.11.18",
    cardTitle: "Hi-SEs 중간보고 일정",
  },
  {
    date: "2023.11.21",
    cardTitle: "소규모합병을 위한 기준일 설정 공고",
  },
  {
    date: "2023.11.20",
    cardTitle: "제 4기 결산공고",
  },
  {
    date: "2023.11.19",
    cardTitle: "HD현대중공업 11월 공지",
  },
  {
    date: "2023.11.18",
    cardTitle: "Hi-SEs 중간보고 일정",
  },
])

// Card News Carousel

// 카드뉴스 Carousel stop btn
const stop = ref(false)

import mainNewsCard1 from "@/assets/images/main/mainNewsCard1.png"
import mainNewsCard2 from "@/assets/images/main/mainNewsCard2.png"
import mainNewsCard3 from "@/assets/images/main/mainNewsCard3.png"
import mainNewsCard4 from "@/assets/images/main/mainNewsCard4.png"
import mainNewsCard5 from "@/assets/images/main/mainNewsCard5.png"

const CardNewsImgData = ref([
  {
    img: "mainNewsCard1",
    cardTitle: "KOSHA 카드뉴스",
    cardContents1: "제조업 12대 사망사고",
    cardContents2: "기인물별 안전조치",
    date: "2023.11.21",
  },
  {
    img: "mainNewsCard2",
    cardTitle: "HD 현대",
    cardContents1: "모두가 함께하는",
    cardContents2: "안전 원팀!",
    date: "2023.11.20",
  },
  {
    img: "mainNewsCard3",
    cardTitle: "KOSHA 카드뉴스",
    cardContents1: "안전보건 콘텐츠",
    cardContents2: "택배로 받아보세요!",
    date: "2023.11.19",
  },
  {
    img: "mainNewsCard4",
    cardTitle: "HD 현대",
    cardContents1: "근로자 안전보건교육",
    cardContents2: "대상사업장 조회시스템",
    date: "2023.11.18",
  },
  {
    img: "mainNewsCard5",
    cardTitle: "KOSHA 카드뉴스",
    cardContents1: "건설현장 12대 사망사고 기인물",
    cardContents2: "핵심안전조치",
    date: "2023.11.17",
  },
])
const CardNewsImg = {
  mainNewsCard1: mainNewsCard1,
  mainNewsCard2: mainNewsCard2,
  mainNewsCard3: mainNewsCard3,
  mainNewsCard4: mainNewsCard4,
  mainNewsCard5: mainNewsCard5,
}

// 영상 교육자료 carousel
//  Carousel stop btn
const stop1 = ref(false)

import mainEduCard1 from "@/assets/images/main/mainEduCard1.png"
import mainEduCard2 from "@/assets/images/main/mainEduCard2.png"
import mainEduCard3 from "@/assets/images/main/mainEduCard3.png"
import mainEduCard4 from "@/assets/images/main/mainEduCard4.png"
import mainEduCard5 from "@/assets/images/main/mainEduCard5.png"

const CardEduImgData = ref([
  {
    img: "mainEduCard1",
    cardTitle: "HD 현대",
    cardContents1: "2023 정기안전보건교육",
    cardContents2: "산업안전보건법의 이해",
    date: "2023.11.21",
  },
  {
    img: "mainEduCard2",
    cardTitle: "한국산업안전보건공단",
    cardContents1: "아나운서 안젤이가 전하는",
    cardContents2: "안전보건 소식",
    date: "2023.11.20",
  },
  {
    img: "mainEduCard3",
    cardTitle: "한국산업안전보건공단",
    cardContents1: "위험성평가란 무엇인가요?",
    cardContents2: "",
    date: "2023.11.19",
  },
  {
    img: "mainEduCard4",
    cardTitle: "한국산업안전보건공단",
    cardContents1: "2023 건설현장 TBM 우수활동",
    cardContents2: "영상 콘텐츠 공모전",
    date: "2023.11.18",
  },
  {
    img: "mainEduCard5",
    cardTitle: "TV 캠페인",
    cardContents1: "숨어있는 위험이를 찾아라!",
    cardContents2: "",
    date: "2023.11.17",
  },
])
const CardEduImg = {
  mainEduCard1: mainEduCard1,
  mainEduCard2: mainEduCard2,
  mainEduCard3: mainEduCard3,
  mainEduCard4: mainEduCard4,
  mainEduCard5: mainEduCard5,
}

// 주요 Dashboard
const CardDashboard = ref([
  {
    cardTitle: "리스크공모전",
  },
  {
    cardTitle: "부서별 리스크 관리",
  },
  {
    cardTitle: "사고/통계",
  },
  {
    cardTitle: "안전수칙위반",
  },
  {
    cardTitle: "안전점검",
  },
  {
    cardTitle: "위험성평가",
  },

  {
    cardTitle: "리스크공모전",
  },
  {
    cardTitle: "부서별 리스크 관리",
  },
  {
    cardTitle: "사고/통계",
  },
  {
    cardTitle: "안전수칙위반",
  },
  {
    cardTitle: "안전점검",
  },
  {
    cardTitle: "위험성평가",
  },
])

const show = ref(false)
const sub = ref("")
const index = ref("")

const test = (menu, i) => {
  show.value = true
  sub.value = menu
  index.value = i
}

const onClickOutside = () => {
  show.value = false
}

// side Quick Menu Icon
import quick1 from "@/assets/images/main/qicon_01.png"
import quick2 from "@/assets/images/main/qicon_02.png"
import quick3 from "@/assets/images/main/qicon_03.png"
import quick31 from "@/assets/images/main/qicon_03.png"
import quick32 from "@/assets/images/main/qicon_04.png"
import quick33 from "@/assets/images/main/qicon_05.png"
import quick4 from "@/assets/images/main/qicon_06.png"
import quick41 from "@/assets/images/main/qicon_06.png"
import quick42 from "@/assets/images/main/qicon_07.png"
import quick5 from "@/assets/images/main/qicon_08.png"

const quickMenuImg = {
  quick1: quick1,
  quick2: quick2,
  quick3: quick3,
  quick31: quick31,
  quick32: quick32,
  quick33: quick33,
  quick4: quick4,
  quick41: quick41,
  quick42: quick42,
  quick5: quick5,
}

const quickMenu = ref([
  {
    src: "quick1",
    title: "날씨",
    caption: "",
    inner: [],
  },
  {
    src: "quick2",
    title: "승인ㆍ결재",
    caption: "",
    inner: [],
  },
  {
    src: "quick3",
    title: "일정ㆍ업무",
    caption: "",
    inner: [
      {
        src: "quick31",
        name: "일정/업무 관리",
        caption: "",
      },
      {
        src: "quick32",
        name: "건강검진 일정",
        caption: "",
      },
      {
        src: "quick33",
        name: "개인 교육일정",
        caption: "",
      },
    ],
  },
  {
    src: "quick4",
    title: "포인트",
    caption: "",
    inner: [
      {
        src: "quick41",
        name: "안전 마일리지",
        caption: "215",
      },
      {
        src: "quick42",
        name: "복지포인트",
        caption: "1,589",
      },
    ],
  },
  {
    src: "quick5",
    title: "당신의 아이디어",
    caption: "",
    inner: [],
  },
])

onBeforeUnmount(() => {
  // document.removeEventListener("click", documentClick)
})
</script>

<template>
  <v-row no-gutters align-content="start" justify="center" class="homeView">
    <!-- Main Carousel -->
    <v-col cols="12" class="mainCarousel">
      <v-carousel
        cycle
        height="370"
        class="overflow-visible"
        :show-arrows="false"
        :interval="3500"
        hide-delimiter-background
      >
        <div class="carouselInput d-flex justify-center align-center">
          <div class="mainInputWrap white--text d-flex justify-center align-center">
            <v-select
              v-model="selected"
              :items="selectList"
              class="carouselSelect"
              hide-details
              flat
              :menu-props="{
                contentClass: 'mainSelect',
                contained: true,
              }"
              item-value="id"
              item-title="text"
              variant="solo"
            >
              <template #item="{ props }">
                <v-list-item @mousedown="onSelected(props)">{{ props.title }}</v-list-item>
              </template>
            </v-select>
            <v-text-field
              v-model="search"
              placeholder="검색어를 입력하세요"
              variant="solo"
              class="carouselSearch"
              hide-details
              flat
              @keydown.enter="onSearch"
            >
              <template v-slot:append-inner>
                <svg-icon name="mainSearch" class="mR-3 cursor-pointer" @click="onSearch" />
              </template>
            </v-text-field>
          </div>
          <v-sheet width="652" height="185" class="autoSearch px-5 pb-5">
            <v-divider />
            <v-row no-gutters="" class="autoWrap pT-30 pX-14">
              <v-col cols="3"> <p class="f-16 w-600">메뉴 바로가기</p></v-col>
              <v-col cols="9" class="d-flex align-center">
                <p class="mR-10">사업부 안전용</p>
                <svg-icon name="arrowR"
              /></v-col>
            </v-row>
          </v-sheet>
        </div>

        <!-- <div class="carouselLink">
          <v-row no-gutters>
            <v-col class="footerText02 pa-0 mt-4 btnContainer text-white">
              <v-btn variant="plain" class="px-0 mr-2">안전지원</v-btn>
              <v-divider thickness="2" vertical class="divider"></v-divider>
              <v-btn variant="plain" class="px-0 mx-2">위험성평가</v-btn>
              <v-divider thickness="2" vertical class="divider"></v-divider>
              <v-btn variant="plain" class="px-0 mx-2">통합자료실</v-btn>
              <v-divider thickness="2" vertical class="divider"></v-divider>
              <v-btn variant="plain" class="px-0 mx-2">안전 마일리지</v-btn>
              <v-divider thickness="2" vertical class="divider"></v-divider>
              <v-btn variant="plain" class="px-0 ml-2">교육자료</v-btn>
            </v-col>
          </v-row>
        </div> -->

        <v-carousel-item v-for="(item, i) in imgData" :key="i" transition="new-transition">
          <v-row no-gutters class="fill-height text-center">
            <v-col cols="12">
              <p v-html="item.slogan" class="ma-0 pa-0 carouselInnerText"></p>
              <v-img width="100%" height="100%" cover :src="CarouselImg[item.img]"
            /></v-col>
          </v-row>
        </v-carousel-item>
      </v-carousel>
    </v-col>

    <!-- Card 영역 -->
    <v-col cols="12" class="mainCard pt-2">
      <v-sheet
        color="white"
        width="1200"
        min-width="1200"
        height="616"
        class="pt-16 d-flex justify-space-between"
        elevation="0"
        style="margin: 0 auto"
      >
        <!-- 공지사항 -->

        <div class="mainCardContent mainCardContent1">
          <v-card-title class="pa-0 pb-5 d-flex align-self-start align-center">
            <div>공지사항</div>
            <v-btn class="hoverBtn" size="x-small" variant="plain"> <svg-icon name="arrowRight" /></v-btn>
          </v-card-title>
          <v-sheet width="279" height="419" border class="mainSheetBorder pa-2">
            <v-card width="100%" height="390" elevation="0" class="px-3 pT-0 mainListCard overflow-auto">
              <v-list v-for="(item, i) in NoticeList" :key="i" class="mainList">
                <v-hover>
                  <template v-slot:default="{ isHovering, props }">
                    <div v-bind="props" class="list1 pt-2">
                      <span class="mainCaption3 text-textCaption">{{ item.date }}</span>
                      <p :class="isHovering ? 'text-primary' : ''" class="mainCaption6 pt-2 pb-6">
                        {{ item.cardTitle }}
                      </p>
                      <v-divider v-if="i < NoticeList.length - 1" :key="`${i}-divider`"></v-divider>
                    </div>
                  </template>
                </v-hover>
              </v-list>
            </v-card>
          </v-sheet>
        </div>

        <!-- 카드뉴스 -->
        <div class="mainCardContent mainCardContent2">
          <v-card-title class="pa-0 pb-5">카드뉴스 </v-card-title>
          <v-sheet
            width="279"
            height="419"
            border
            class="d-flex flex-column justify-space-between mainSheetBorder overflow-hidden"
          >
            <v-carousel
              height="419"
              :cycle="stop ? false : true"
              :show-arrows="false"
              :interval="3500"
              hide-delimiter-background
            >
              <v-carousel-item v-for="(item, i) in CardNewsImgData" :key="i">
                <v-row no-gutters align-content="start">
                  <v-col cols="12">
                    <v-img width="100%" contain :src="CardNewsImg[item.img]" />
                  </v-col>
                  <v-col cols="12" class="list2 pa-5">
                    <p class="mainCaption4 text-primary pt-2 pb-2">{{ item.cardTitle }}</p>
                    <p class="mainSubtitle">
                      {{ item.cardContents1 }}
                      <span>{{ item.cardContents2 }}</span>
                    </p>
                    <p class="mainCaption3 text-textCaption pt-8">{{ item.date }}</p>
                  </v-col>
                </v-row>
              </v-carousel-item>
            </v-carousel>
            <v-btn class="carouselStopBtn" variant="plain" @click="stop = !stop">
              <svg-icon v-if="!stop" name="stop" />
              <svg-icon v-else name="play" />
            </v-btn>
          </v-sheet>
        </div>

        <!-- 영상 교육자료 -->
        <div class="mainCardContent mainCardContent3">
          <v-card-title class="pa-0 pb-5">영상 교육자료 </v-card-title>
          <v-sheet
            width="279"
            height="419"
            border
            class="d-flex flex-column justify-space-between mainSheetBorder overflow-hidden"
          >
            <v-carousel
              height="419"
              :cycle="stop1 ? false : true"
              :show-arrows="false"
              :interval="3600"
              hide-delimiter-background
            >
              <v-carousel-item v-for="(item, i) in CardEduImgData" :key="i">
                <v-row no-gutters align-content="start">
                  <v-col cols="12">
                    <v-img width="100%" contain :src="CardEduImg[item.img]" />
                  </v-col>
                  <v-col cols="12" class="list2 pa-5">
                    <p class="mainCaption4 text-primary pt-2 pb-2">{{ item.cardTitle }}</p>
                    <p class="mainSubtitle">
                      {{ item.cardContents1 }}
                      <span>{{ item.cardContents2 }}</span>
                    </p>
                    <p class="mainCaption3 text-textCaption pt-8">{{ item.date }}</p>
                  </v-col>
                </v-row>
              </v-carousel-item>
            </v-carousel>
            <v-btn class="carouselStopBtn" variant="plain" @click="stop1 = !stop1">
              <svg-icon v-if="!stop1" name="stop" />
              <svg-icon v-else name="play" />
            </v-btn>
          </v-sheet>
        </div>

        <!-- 주요 대시보드 -->
        <div class="mainCardContent mainCardContent4">
          <v-card-title class="pa-0 pb-5">주요 대시보드</v-card-title>
          <v-card class="d-flex flex-column pR-4 mainListCard overflow-y-auto" width="279" height="419" elevation="0">
            <v-sheet
              v-for="(item, i) in CardDashboard"
              :key="i"
              width="270"
              height="59"
              border
              class="mainList mainSheetBorder mB-13"
            >
              <v-hover open-delay="50" v-slot:default="{ isHovering, props }">
                <div v-bind="props" class="d-flex align-center justify-space-between pl-6 pY-11">
                  <span>{{ item.cardTitle }}</span>
                  <v-btn variant="plain" class="text-right">
                    <svg-icon v-if="isHovering" name="goInto" class="text-primary"></svg-icon>
                    <svg-icon v-else name="arrowRight" class="text-textMain"></svg-icon>
                  </v-btn>
                </div>
              </v-hover>
            </v-sheet>
          </v-card>
        </div>
      </v-sheet>
    </v-col>

    <!-- 차트 영역 -->
    <v-col cols="12" class="mainChart">
      <v-sheet class="blueBg" color="#E8F1FF50" width="100%" height="145" style="margin: 0 auto"></v-sheet>
      <v-card
        elevation="0"
        color="#ffffff00"
        width="1200"
        min-width="1200"
        height="290"
        class="overflow-visible"
        style="margin: 0 auto"
      >
        <v-card-title class="pa-0 py-7 d-flex align-self-start align-center mainChartTitle">
          2023년 11월 21일<span class="ml-1">(화)</span>
        </v-card-title>
        <div class="d-flex justify-space-between align-center">
          <v-hover v-slot="{ isHovering, props }">
            <v-sheet
              v-bind="props"
              width="893"
              height="130"
              border
              class="mainSheetBorder chartSheet d-flex justify-space-around align-center pt-8 px-9"
            >
              <v-expand-transition>
                <v-card
                  color="rgba(51, 56, 91, 0.8)"
                  v-if="isHovering"
                  class="mainSheetBorder d-flex justify-end text-white align-center v-card--reveal pR-44"
                  style="height: 100%; width: 100%"
                >
                  더보기 <svg-icon class="mL-10" name="goInto" />
                </v-card>
              </v-expand-transition>
              <v-sheet
                width="121"
                height="41"
                color="primary"
                border
                class="mainSheetBorder d-flex justify-center align-center mainBadge"
                >SLI
              </v-sheet>
              <v-sheet width="150" height="32">
                <v-progress-linear model-value="88" height="5" rounded bg-color="chart10" color="chart1" />
                <div class="d-flex justify-space-between pt-3">
                  <span class="mainCaption6 text-textMain">전사</span>
                  <span class="mainCaption9 text-textInfo">88</span>
                </div>
              </v-sheet>
              <v-sheet width="150" height="32">
                <v-progress-linear model-value="76" height="5" rounded bg-color="chart20" color="chart2" />
                <div class="d-flex justify-space-between pt-3">
                  <span class="mainCaption6 text-textMain">특수선</span>
                  <span class="mainCaption9 text-chart1">76</span>
                </div> </v-sheet
              ><v-sheet width="150" height="32">
                <v-progress-linear model-value="94" height="5" rounded bg-color="chart30" color="chart3" />
                <div class="d-flex justify-space-between pt-3">
                  <span class="mainCaption6 text-textMain">조선해양</span>
                  <span class="mainCaption9 text-chart3">94</span>
                </div> </v-sheet
              ><v-sheet width="150" height="32">
                <v-progress-linear model-value="52" height="5" rounded bg-color="chart40" color="chart4" />
                <div class="d-flex justify-space-between pt-3">
                  <span class="mainCaption6 text-textMain">엔진기계</span>
                  <span class="mainCaption9 text-chart4">52</span>
                </div>
              </v-sheet>
            </v-sheet>
          </v-hover>
          <v-sheet width="275" height="130" border class="mainSheetBorder infoSheet pt-13 px-11 pb-7">
            <v-sheet
              width="133"
              height="41"
              color="primary"
              border
              class="mainSheetBorder d-flex justify-center align-center mainBadge"
              >사고예측정보</v-sheet
            >
            <div class="d-flex justify-space-between pb-1">
              <span class="text-primary mainCaption7">오전</span>
              <span class="text-textCaption mainCaption5">대조 1부</span>
              <span class="text-textMain mainCaption8">떨어짐 83%</span>
            </div>
            <div class="d-flex justify-space-between pb-1">
              <span class="text-primary mainCaption7">오후</span>
              <span class="text-textCaption mainCaption5">대조 1부</span>
              <span class="text-textMain mainCaption8">떨어짐 83%</span>
            </div>
          </v-sheet>
        </div>
      </v-card>
    </v-col>

    <!-- side Quick 메뉴 영역 -->
    <div class="sideQuick">
      <div class="floatingMenu">
        <div class="text-center pB-11 btnWrap" v-for="(menu, i) in quickMenu" :key="i">
          <v-btn
            class="mb-1"
            icon
            color="#fff"
            width="66"
            height="66"
            @click="test(menu, i)"
            v-click-outside="onClickOutside"
          >
            <v-img :src="quickMenuImg[menu.src]" :width="39" contain></v-img>
          </v-btn>
          <p class="mainCaption3">{{ menu.title }}</p>
        </div>

        <!-- btn 바깥영역 click시 btn hidden 기능 미처리  -->
        <div v-if="sub.inner != null">
          <div class="hiddenMenu">
            <div v-for="(inner, i) in sub.inner" :key="i" class="hiddenWrap">
              <div class="hiddenBtnWrap text-center" :class="`dial_${index}`">
                <v-btn elevation="3" class="mb-1" color="#fff" icon width="66" height="66">
                  <v-img :src="quickMenuImg[inner.src]" :width="39" contain></v-img>
                </v-btn>
                <div class="hiddenBtnWrapText text-center">
                  <p class="mainCaption3">{{ inner.name }}</p>
                  <p class="mainCaption4">{{ inner.caption }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-row>

  <!-- #####공지사항 화면그리기 시작#####-->

  <VDialog persistent scrim v-model="noticeDialog" class="noticeDialog" width="750" max-height="700">
    <VRow
      class="closeRow"
      style="position:relative; left:4px; bottom:3px; background-color: #1d43ca; height: 45px; width:750px;!important"
    >
      <span style="font-size: 16px; color: white; margin-left: 20px; margin-top: 10px">공지사항</span>
      <v-icon
        @mouseover="mouseover"
        @click="closeNoticeInfo"
        id="closeButton"
        size="small"
        style="height: 32px; color: white; margin-left: 635px; margin-top: 5px"
        icon="mdi-window-close"
        class="mB-3"
      >
      </v-icon>
    </VRow>
    <v-carousel color="#d9d9d9" hide-delimiter-background height="800" delimiter-icon="mdi-circle">
      <template v-slot:prev="{ props }">
        <v-icon
          style="color: #1d43ca; position: relative; top: -120px; right: 10px; z-index: 2"
          icon="mdi-chevron-left"
          @click="props.onClick"
        ></v-icon>
      </template>
      <template v-slot:next="{ props }">
        <v-icon
          style="color: #1d43ca; position: relative; top: -120px; left: 10px; z-index: 2"
          icon="mdi-chevron-right"
          @click="props.onClick"
        ></v-icon>
      </template>
      <v-carousel-item v-for="(notice, index) in noticeArray" :key="index" cover>
        <NoticeInfo :notice-info-array="notice" />
      </v-carousel-item>
    </v-carousel>
    <VRow
      class="closeRow"
      style="position:relative; left:4px; bottom:3px; background-color: #1d43ca; height: 45px; width:750px;!important"
    >
      <VCheckbox
        true-value="Y"
        false-value="N"
        small
        v-model="oneDayCookieCheckBoxValue"
        color="white"
        style="color: white; margin-left: 20px; margin-top: 5px"
      />
      <span style="font-size: 14px; color: white; margin-left: 5px; margin-top: 8px"> 하루동안 이 창을 열지 않음</span>
      <VCheckbox
        true-value="Y"
        false-value="N"
        small
        v-model="threeDayCookieCheckBoxValue"
        color="white"
        style="color: white; margin-left: 20px; margin-top: 5px"
      />
      <span style="font-size: 14px; color: white; margin-left: 5px; margin-top: 8px">3일 동안 이 창을 열지 않음</span>
    </VRow>
  </VDialog>

  <!-- #####공지사항 화면그리기 끝#####-->
</template>

<style>
.custom-carousel .v-carousel__controls {
  position: absolute; /* Allow positioning outside the flow */
  bottom: 15px; /* Set distance from bottom edge (adjust as needed) */
  /* Alternatively, for top placement: */
  top: 15px;
}
.layout-page-content {
  height: auto;
}

.sideBtn {
  cursor: pointer;
  width: 6px;
  height: 6px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.5);
  transition: all, 3s;
}

.sideBtn:not(:first-of-type) {
  margin-left: 5px;
}

.activeSideBtn {
  width: 16px;
  background: rgba(255, 255, 255, 0.8);
}
</style>

<route lang="yaml">
meta:
  noAuth: true
</route>
