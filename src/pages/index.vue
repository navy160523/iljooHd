<script setup>
import EventHandler from '@hiway/utils/eventHandler'
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommonStore } from '@hiway/stores/common'

import DefaultFooter from '@/layouts/components/Footer.vue'

import WeatherPopUp from '@/pages/99_indexPopUp/weatherPopUp.vue'
import { useMenuStore } from '@hiway/stores/menu'
import NoticeInfo from '@/layouts/components/NoticeInfo.vue'
import dayjs from 'dayjs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonRequest, commonSearchApi } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import DATAPopup from '@/pages/99_indexPopUp/DATAPopup.vue'
import ApprovalPopup from '@/pages/99_indexPopUp/approvalPopup.vue'
import OPRAJ0010Popup from '@/pages/80_operation/OPR_A/OPRAJ0010Popup.vue'
import DATCA0020Popup from '@/pages/70_data/DAT_C/DATCA0020Popup.vue'
import DATCA0020Popup2 from '@/pages/70_data/DAT_C/DATCA0020Popup2.vue'
import youtubeLogo from '@/assets/images/index/youtube_logo.png'

import appStore from '@/assets/images/main/appStore.png'
import iosqrcode from '@/assets/images/main/iosqrcode.png'
import googlePlay from '@/assets/images/main/googlePlay.png'
import androidqrcode from '@/assets/images/main/androidqrcode.png'
import mobileApp from '@/assets/images/main/mobileApp.png'

import OPRAB0010 from '@/pages/80_operation/OPR_A/OPRAB0010.vue'
import PersonalProcessingPolicy from '@/layouts/components/PersonalProcessingPolicy.vue'
import VideoPopup from '@/pages/videoPopup.vue'
import MessagePopup from '@/components/MessagePopup.vue'

import OPRAJ0010Popup03 from '@/pages/80_operation/OPR_A/OPRAJ0010Popup03.vue'
//공지사항 관련 변수 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuStore = useMenuStore()
const noticeArray = reactive([]) //보여줘야할 공지사항을 저장하고 있는 배열
const notShowNoticeNo = reactive([]) //띄운 공지사항중에 오늘하루 보지않기 체크하고 닫기 누른 공지사항 번호 저장하는 배열
const noticeDialog = ref(false) //공지사항 dialog vmodel
const noticePopup = ref(null)
const dialogHeight = ref(1000)
const oneDayCookieCheckBoxValue = ref(null) //하루동안 이 창을 열지않음 체크박스 v-model
const threeDayCookieCheckBoxValue = ref(null) // 3일 동안 이 창을 열지않음 체크박스 v-model
const commonStore = useCommonStore()
const personalProcessingPolicy = ref(null)

let showNoticeFlag = ref(null)
let dATAPopup = ref(null)
let approvalPopup = ref(null)
const oPRAJ0010Popup = ref(null)
const dATCA0020Popup = ref(null)
const dATCA0020Popup2 = ref(null)
const weatherPopUp = ref(null)
const oPRAB0010 = ref(false) // 일정/업무 팝업
const NOTICE_NO = ref('10')
const popupTitle = ref('')
const appLength = ref(0)
const appList = reactive([])
const isPoint = ref(false)
const videoPopup = ref(null)
const oprLength = ref(0)
const message1 = ref(null)
const message2 = ref(null)
const searchNoticeParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_POPUP: 'Y',
})

const router = useRouter()

//공지사항 관련 변수 끝

// 공지사항 관련 로직 시작
const searchNotice = () => {
  //팝업여부 Y 공지사항 조회
  //new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).showMessage(false).run()

  // commonRequest('/hse/operation/search01', {
  //   queryId: 'OPRAJ0010_MAIN_NOTICE_SEARCH_01',
  //   param: searchNoticeParam,
  // })
  //   .then((res) => {
  //     for (let i = 0; i < res.ORESULT_CUR.length; i++) {
  //       if (notShowNoticeNo.includes(res.ORESULT_CUR[i].NOTICE_NO.toString()) === false) {
  //         noticeArray.push(res.ORESULT_CUR[i])
  //       }
  //     }
  //   })
  //   .finally(() => {
  //     if (noticeArray.length > 0) {
  //       noticeDialog.value = true
  //     }
  //   })

  commonRequest('/hse/operation/search01', {
    queryId: 'OPRAJ0010_SEARCH_NOTICE',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      NOTICE_POPUP: 'Y',
      IS_MAIN: 'Y',
      NOTICE_MENU: '',
    },
  }).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      noticePopup.value.openPopup({
        isMain: 'Y',
        list: res.ORESULT_CUR
      })
    }
  })
}

const getCookie = () => {
  // 쿠키 가져와서 파싱 후 보여주지 말아야할 공지사항 번호 추출
  let expireCookies = document.cookie
  showNoticeFlag.value = expireCookies.includes('NOTICE-EXPIRE-COOKIE') ? true : false
  // let splitedCookies = expireCookies.split(";")
  // for (let i = 0; i < splitedCookies.length; i++) {
  //   let no = splitedCookies[i].split("=")
  //   notShowNoticeNo.push(no[1]) //쿠키가 생성되어서 보여주지 말아야할 공지사항 번호를 담고있는 배열
  // }
}

const setCookie = () => {
  //쿠키생성
  if (oneDayCookieCheckBoxValue.value === 'Y') {
    let date = new Date(Date.now() + 86400e3)
    let expireDate = 'expires=' + date.toUTCString() //쿠키만료시간 현재시각 + 1일
    let cookieName = 'NOTICE-EXPIRE-COOKIE' + '='
    let cookieValue = 'expire' + ';'
    document.cookie = cookieName + cookieValue + expireDate
  }
  if (threeDayCookieCheckBoxValue.value === 'Y') {
    let date = new Date(Date.now() + 86400e3 * 3)
    let expireDate = 'expires=' + date.toUTCString() //쿠키만료시간 현재시각 + 3일
    let cookieName = 'NOTICE-EXPIRE-COOKIE' + '='
    let cookieValue = 'expire' + ';'
    document.cookie = cookieName + cookieValue + expireDate
  }
}

const closeNoticeInfo = () => {
  if (oneDayCookieCheckBoxValue.value === 'Y') {
    setCookie()
  }
  if (threeDayCookieCheckBoxValue.value === 'Y') {
    setCookie()
  }
  noticeDialog.value = false
}

const mouseover = () => {
  const closeButton = document.getElementById('closeButton')
  closeButton.style.cursor = 'pointer'
}

//체크박스 감지
watch(
  () => oneDayCookieCheckBoxValue.value,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      threeDayCookieCheckBoxValue.value = 'N'
    }
  }
)
watch(
  () => threeDayCookieCheckBoxValue.value,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      oneDayCookieCheckBoxValue.value = 'N'
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
  vm.$nextTick(async () => {
    getCookie()
    if (showNoticeFlag.value === false) {
      searchNotice()
    }
    /* ******************** 공지사항 조회 ******************** */
    commonRequest('/hse/main/MAINPAGE_SEARCH_03', {
      queryId: 'MAINPAGE_SEARCH_03',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }).then((res) => {
      NoticeList.value = []
      res.ORESULT_CUR.forEach((e) => {
        let NOTICE_NOTE_HTML = e.NOTICE_NOTE
        let NOTICE_NOTE_NO_HTML = e.NOTICE_NOTE.replace(/<[^>]+>/g, '')

        NoticeList.value.push({
          CMPNY_DIV: e.CMPNY_DIV,
          NOTICE_NO: e.NOTICE_NO,
          NOTICE_TITLE: e.NOTICE_TITLE,
          NOTICE_NOTE: NOTICE_NOTE_HTML,
          NOTICE_NOTE_NO_HTML: NOTICE_NOTE_NO_HTML,
          INSERT_DATE: e.INSERT_DATE,
          NOTICE_EXPOSURE: e.NOTICE_EXPOSURE,
          NOTICE_FILEID: e.NOTICE_FILEID,
          NOTICE_PERIOD: e.NOTICE_PERIOD,
          KOR_NM: e.KOR_NM,
          NOTICE_RANGE: e.NOTICE_RANGE,
        })
      })
    })

    /* ******************** 카드뉴스 조회 ******************** */
    commonRequest('/hse/data/DATCA0030_SEARCH_02', {
      queryId: 'MAINPAGE_SEARCH_04',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }).then((res) => {
      // contentsList.value[0].list = res.ORESULT_CUR

      res.ORESULT_CUR.forEach((item, idx) => {
        contentsList.value[0].list.push(item)
        commonSearchApi({
          queryId: 'searchFile',
          param: { CMPNY_DIV: item.CMPNY_DIV, FILE_ID: item.THUMBNAIL_FILE_ID },
        }).then((res2) => {
          commonDownloadFilesApi(res2.ORESULT_CUR[0]).then((res3) => {
            const blob = new Blob([res3])
            const imageURL = URL.createObjectURL(blob)

            contentsList.value[0].list[idx].img = imageURL
          })
        })
      })

      contentsList.value[0].list = res.ORESULT_CUR
    })

    /* ******************** 승인, 결재 리스트 조회 ******************** */
    commonSearchApi({
      queryId: 'MAINPAGE_SEARCH_07',
      param: { CMPNY_DIV: userStore.cmpnyDiv, EMP_ID: userStore.userId },
    }).then((res) => {
      appLength.value = res.ORESULT_CUR.length
      res.ORESULT_CUR.forEach((e) => {
        appList.push(e)
      })
    })

    let params = {
      DTE_FROM: dayjs().subtract(1, 'year').format('YYYYMMDD'),
      DTE_TO: dayjs().format('YYYYMMDD'),
      EMPNO_TO: userStore.userId,
      CMPNY_DIV: userStore.cmpnyDiv,
    }

    commonSearchApi({ queryId: 'OPRAB0010_SEARCH_01', param: params }).then(async (res) => {
      let result = await res.ORESULT_CUR.filter(
        (item) => item.APP_STATUS != 'Y' && !item.APP_STATUS_NM.includes('반려')
      )

      oprLength.value = result.length
    })

    setSAFFB0010()
  })
  //2025.07.09 김현재 작성
  //보건관리계획서 모니터링에서 알림발송으로 지정된 협력사 조회후 해당 협력사 로그인유저에게 팝업 띄우기
  //마운트할때 유저정보를 새로 가져오는 이유는 새로고침을 하면 마운트시점과 userStore를 가져오는 시점이 안맞아서 코드가 빈값으로 들어가는 경우가 있음
  //그래서 마운트 할때마다 유저정보를 새로고침 개념으로 들고옴
  userStore.setUserInfo().then(() => {
    if (userStore.userDiv !== 'A') {
      //분기
      let month = dayjs().format('MM')
      let QUARTER
      if (['01', '02', '03'].includes(month)) {
        // console.log('1')
        QUARTER = '1'
      } else if (['04', '05', '06'].includes(month)) {
        // console.log('2')
        QUARTER = '2'
      } else if (['07', '08', '09'].includes(month)) {
        // console.log('3')
        QUARTER = '3'
      } else if (['10', '11', '12'].includes(month)) {
        // console.log('4')
        QUARTER = '4'
      }

      //직영이 아니다
      let param1 = {
        CMPNY_DIV: userStore.cmpnyDiv,
        VEND_CD: userStore.asgnCd,
        YEAR: new Date().getFullYear(),
      }
      //직영이 아니다
      let param2 = {
        CMPNY_DIV: userStore.cmpnyDiv,
        VEND_CD: userStore.asgnCd,
        YEAR: new Date().getFullYear(),
        QUARTER: QUARTER,
        USER_ID: userStore.userId,
      }
      let data
      //보건관리계획서 작성율,알림발송대상 조회
      Promise.all([
        commonSearchApi({
          queryId: 'HLTKB0010_SEARCH_01',
          param: param1,
        }),
        commonSearchApi({
          queryId: 'HLTKB0010_SEARCH_02',
          param: param1,
        }),
        commonSearchApi({
          queryId: 'HLTKC0050_SEARCH_04',
          param: param2,
        }),
      ]).then(async (res) => {
        if (res[0]?.ORESULT_CUR[0]?.COMPLETE_PERCENT !== '100.00%' && res[1].ORESULT_CUR[0].RESULT_YN === 'Y') {
          let message = `건강관리위험대상자에 대한
                      보건관리계획 작성 ‘미완료’ 상태입니다.
                            확인 후 조치 바랍니다.
                                (인원별 연 1회)
                               <div style=color:red;>
                            * 미완료 상태일 시, 신규 출입증 발급이 제한됩니다.
                                </div>
                            - 안전보건지원부 -`
          await message1.value.openMessagePopup(message) //다른 메세지 팝업 사용하려면 앞에 await 붙여서 사용해야함 await안붙이면 마지막 팝업만 나옴
        }
        if (res[2].ORESULT_CUR.length > 0) {
          let message =
            param2.YEAR +
            `년 ` +
            QUARTER +
            `분기 고령근로자 건강상태 평가 결과,
                        사후관리대상으로 분류된 인원을 통보하오니
                        협력사 자체 사후관리를 철저히 이행해주시기 바랍니다.

                              - 안전보건지원부 -`
          let htmlString = `
          <div style="max-height: 200px; width : 450px; overflow-y: auto;">
            <table border="1" style="border-collapse: separate; border-spacing: 0; text-align: center; width : 100%">
                <thead>
                  <tr>
                    <th style="width:35%; position: sticky; top: 0; z-index: 1; background-color: skyblue; box-sizing: border-box;">이름</th>
                    <th style="position: sticky; top: 0; z-index: 1; background-color: skyblue; box-sizing: border-box;">관리대상 항목</th>
                  </tr>
                </thead>`
          res[2].ORESULT_CUR.forEach((item) => {
            htmlString += `<tbody><tr><td>${item.EMP_NM}(${item.EMP_NO})</td>
                <td style="padding-left:4px; text-align: left"> ${item.TOT_RESULT}</td></tr></tbody>`
          })

          htmlString += `</table></div>`
          await message2.value.openMessagePopup(message, htmlString)
        }

        //보건관리계획서 작성율 100%이고,알림발송대상이면 N으로변경
        if(res[0].ORESULT_CUR.length > 0 && res[1].ORESULT_CUR.length > 0) {
          if (res[0].ORESULT_CUR[0].COMPLETE_PERCENT === '100.00%' && res[1].ORESULT_CUR[0].RESULT_YN === 'Y') {
            param1.USER_ID = userStore.userId
            commonExecuteApi({
              queryId: 'HLTKB0010_SAVE_04',
              list: [param1],
            })
          }
        }
      })
    }
  })

  // 고령근무자 사후관리 현황 알림
  // userStore.setUserInfo().then(() => {
  //   if (userStore.userDiv !== 'A') {
  //     commonSearchApi({
  //       queryId: 'HLTKC0050_SEARCH_04',
  //       param: param,
  //     }).then(async (res) => {
  //       data = res.ORESULT_CUR
  //       if (data.length > 0) {
  //         // if (data.MT_YN=='해당') {

  //         {
  //           /* <table border="1" style="border-collapse: collapse; text-align: center; width : 100%"> */
  //         }

  //         //  다른 메세지 팝업 사용하려면 앞에 await 붙여서 사용해야함 await안붙이면 마지막 팝업만 나옴
  //         //  2025.05.21 내용 추가 openMessagePopup에서 message뒤에 html을 이용하여 테이블을 만들어서 코드를 넣으면 테이블이 같이 생성이 되서 나온다. 테이블이 없으면 null값을 넣어주면 된다.
  //         //   }
  //       }
  //     })
  //   }
  // })
})

/* 상단 hises 로고 클릭시 메인화면 최상단으로 이동 */
router.afterEach((to, from, next) => {
  if (to.fullPath === '/') {
    currentPageIndex.value = 0
    pageScroll()
  }
})

//  메인 새로 추가본

// MAIN Carousel
/* ************** 2024.07.16 윤찬양책임 요청으로 이미지 변경 ************** */
import mainCarouselImg1 from '@/assets/images/main/newCarousel1.jpg'
import mainCarouselImg2 from '@/assets/images/main/newCarousel2.jpg'
import mainCarouselImg3 from '@/assets/images/main/newCarousel3.jpg'

const CarouselImg = {
  mainCarouselImg1: mainCarouselImg1,
  mainCarouselImg2: mainCarouselImg2,
  mainCarouselImg3: mainCarouselImg3,
}

/* **************************** 윤찬양책임 요청으로 HD 현대 >>> HD 현대중공업 으로 변경 2024.07.15 **************************** */
/* **************************** 엄정준책임 요청으로 HD 현대중공업 >>> HD현대중공업 / 1.	HD HEAVY INDUSTRY -> HD HYUNDAI HEAVY INDUSTRIES 으로 변경 2024.09.23 **************************** */
const imgData = ref([
  {
    img: 'mainCarouselImg1',
    slogan:
      '<span class="w-800">미래를</span> 향해 <span class="w-800">안전</span>을 <span class="w-800">항해</span>하는 <span class="w-800">HD현대중공업</span>',
  },
  {
    img: 'mainCarouselImg2',
    slogan:
      '<span style="font-size:40.0pt;"> <span class="w-800">SAFE</span> AND <span class="w-800">ECO</span> FRIENDLY <span class="w-800">HD HYUNDAI HEAVY INDUSTRIES</span></span>',
  },
  // HYUNDAI
  {
    img: 'mainCarouselImg3',
    slogan: '<span class="w-800">CREATIVE</span> WISDOM <span class="w-800">POSITIVE</span> THINKING',
  },
])
// 퀵 메뉴
const quickMenu = ref([
  {
    src: 'quick1',
    title: '나의 할 일',
    caption: '검토/확인 해야 할 일,\n주요일정 등 정보를 확인하세요.',
    path: '/80_operation/OPR_A/OPRAB0010',
  },
  {
    src: 'quick2',
    title: '승인ㆍ결재',
    caption: 'HD오피스를 통한 승인/결재를\n편리하게 관리하세요.',
    // caption: "승인 결재 목록을 한눈에 확인하고\n편리하게 관리하세요.",
  },

  {
    src: 'quick3',
    title: '포인트',
    caption: 'HD안전페이 서비스입니다.\n안전포인트를 확인하세요.',
    path: '/60_edu/EDU_D/EDUDB0020',
  },
  {
    src: 'quick4',
    title: '날씨',
    caption: '우리 작업장의 날씨를\n간편하게 확인하세요.',
  },
])

// Select
const selected = ref('M')
const selectList = ref([
  { id: 'M', text: '메뉴' },
  { id: 'F', text: '자료실' },
])
const onSelected = (param) => {
  selected.value = param.value
}

// Search
const search = ref('')
const searchList = reactive({
  menuList: [], // 검색 메뉴 리스트
  prntList: [], // 부모 메뉴 리스트
  dataList: [], // 자료 리스트
})

/* ************* 검색 기능 ************* */
const onSearch = () => {
  searchList.menuList = []
  searchList.dataList = []
  /* ********* 메뉴 ********* */
  if (selected.value === 'M') {
    menuStore.menus.forEach((e) => {
      if (e.mnu_nm.includes(search.value) && e.path) {
        searchList.menuList.push(e)
      }
    })
  } else {
    /* ********* 자료 ********* */
    commonSearchApi({
      queryId: 'MAINPAGE_SEARCH_01',
      param: { NOTICE_TITLE: search.value },
    }).then((res) => {
      searchList.dataList = res.ORESULT_CUR
    })
  }
}

const dataClick = (e) => {
  dATAPopup.value.openPopup(e)
}

onBeforeUnmount(() => {
  // document.removeEventListener("click", documentClick)
})

//SLI 데이터////////////////////////////////////////////////////////////////////
const setSAFFB0010 = async () => {
  sliList.value = [
    { type: '전사', val: 0, color: '#1A40C7' },
    { type: '조선', val: 0, color: '#7884D9' },
    { type: '해양에너지', val: 0, color: '#08B9C8' },
    { type: '특수선', val: 0, color: '#0581FD' },
    { type: '엔진기계', val: 0, color: '#16C3F4' },
  ]

  let params = {
    CMPNY_DIV: 'HHI',
    OCCUR_FROM: dayjs().add(-1, 'day').format('YYYY-MM-DD'),
    OCCUR_TO: dayjs().add(-1, 'day').format('YYYY-MM-DD'),
  }
  //console.log('setSAFFB0010 params', params)
  let response = await commonSearchApi({ queryId: 'OPRAG0010_SAFFB0010', param: params }) // setComParams() })
  //console.log('setSAFFB0010 response',response.ORESULT_CUR)
  if (response.ORESULT_CUR.length > 0) {
    const temp = response.ORESULT_CUR

    for (let i = 0; i < temp.length; i++) {
      for (let j = 0; j < sliList.value.length; j++) {
        if (temp[i].BSNS_NM === sliList.value[j].type) {
          sliList.value[j].val = temp[i].TOT_SVG
        }
      }
    }
  } /*else {
    sliList.value = [
      { BSNS_NM: '전사', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '조선', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '해양', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '특수선', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '엔진기계', TOT_SVG: 0, TOTAL_GRADE: '' },
    ]
  }*/
}

// SLI 차트
const sliList = ref([
  { type: '전사', val: 0, color: '#1A40C7' },
  { type: '조선', val: 0, color: '#7884D9' },
  { type: '특수선', val: 0, color: '#0581FD' },
  { type: '해양', val: 0, color: '#08B9C8' },
  { type: '엔진기계', val: 0, color: '#16C3F4' },
])
const customBarStyle = (item) => {
  return `height: ${item.val}%; background: linear-gradient(180deg, rgba(22, 195, 244, 0.10) 0%, ${item.color} 100%);`
}

// ⭐ one page scroll event
import { useDisplay } from 'vuetify'
const { height } = useDisplay()
const pages = ref([
  { id: 'main' },
  { id: 'dashboard' },
  { id: 'notice' },
  { id: 'contents' },
  { id: 'sli' },
  { id: 'mobile' },
])
const currentPageIndex = ref(0)
const isMove = ref(false) // 2중 스크롤링을 막기위한 트리거 ( true : 스크롤 불가, false: 스크롤 가능 )

import { useStore } from 'vuex'
const store = useStore()

const handleWheel = (e) => {
  if (!e.ctrlKey) {
    e.preventDefault()
    if (!isMove.value) {
      if (e.deltaY < 0) {
        if (currentPageIndex.value > 0) currentPageIndex.value--
        pageScroll()
      } else {
        if (currentPageIndex.value < pages.value.length - 1) currentPageIndex.value++
        pageScroll()
      }
    }
    store.commit('setCurretPage', currentPageIndex.value) //스토어 homeCurrentPage에 currentPageIndex 값 저장
  }
}
function pageScroll() {
  isMove.value = true
  if (isMove.value) {
    setTimeout(() => {
      window.scrollTo({
        top: height.value * currentPageIndex.value,
        behavior: 'smooth',
      })
    }, 200)
  }
  setTimeout(() => {
    isMove.value = false
  }, 700)
}

// 대시보드 카드
const dashBoard = ref([
  { title: '통합 안전 대시보드', sub: '', path: '/80_operation/OPR_A/OPRAG0011' },
  {
    title: '사고ㆍ통계',
    sub: '사고 Dashboard | 통계 Dashboard',
    path: '/30_safety/SAF_A/SAFAA0010',
  },
  //{ title: "안전점검", sub: "", path: "/30_safety/SAF_C/SAFCA0010" },
  { title: '안전선행지수(SLI)', sub: '', path: '/30_safety/SAF_F/SAFFA0010' },
  {
    title: '전사 리스크 관리',
    sub: '',
    path: '/40_safety-risk/SRM_A/SRMAA0010',
  },
  {
    title: '부서별 리스크 관리',
    sub: '',
    path: '/40_safety-risk/SRM_A/SRMAA0020',
  },
  {
    title: '부서별 위험성평가',
    sub: '',
    img: '',
    path: '/20_risk-assessment/RSK_A/RSKAA0010',
  },
  // { title: "안전교육", sub: "", path: "/60_edu/EDU_A/EDUAB0010" },
  { title: '안전수칙위반', sub: '', path: '/30_safety/SAF_D/SAFDA0010' },
  { title: '협력사 안전관리', sub: '', path: '/30_safety/SAF_I/SAFIA0010' },
])
function scrollDashboard(event) {
  const element = event.target
  const inScrollZone =
    (element.scrollTop === element.scrollHeight - element.clientHeight && event.deltaY > 0) ||
    (element.scrollTop === 0 && event.deltaY < 0)
  if (inScrollZone) {
    event.preventDefault() // 스크롤 이벤트 중지
  }
}
const clickDashboardCard = (item) => {
  if (item.title === '안전점검' || item.title === '전사 리스크 관리' || item.title === '부서별 리스크 관리') {
    vm.$swal({
      title: t('개발중 입니다.'),
      // showCancelButton: true,
      confirmButtonText: '확인',
    })

    return
  }
  commonStore.loading = true
  router.push(item.path).finally(() => {
    commonStore.loading = false
  })
}

/* ******************* Notice ******************* */
const NoticeList = ref([])
const clickNotice = async (item) => {
  commonStore.loading = true
  NOTICE_NO.value = String(item.NOTICE_NO)
  oPRAJ0010Popup.value.openPopup2(item)
}

const clickNoticeList = () => {
  router.push('/80_operation/OPR_A/OPRAJ0010').finally(() => {
    commonStore.loading = false
  })
}

const sliPageMove = () => {
  commonStore.loading = true
  router.push('/40_safety-risk/SRM_D/SRMDA0010').finally(() => {
    commonStore.loading = false
  })
}

// 콘텐츠 자료
const contentsList = ref([
  {
    part: '영상안전보건교육',
    list: [],
  },
  {
    part: '안전 컨텐츠',
    list: [],
  },
  {
    part: 'YOUTUBE',
    list: [],
  },
])
const contentsID = ref('20')

/* ******************* 콘텐츠 자료 카드 클릭 ******************* */
const contentsSelect = (val) => {
  commonStore.loading = true
  contentsID.value = NOTICE_NO

  if (val.NOTICE_DIV === 'MNZFAE11005Y') {
    dATCA0020Popup2.value.openPopup(val)
  } else if (val.NOTICE_DIV === 'MNZFAE11004Y') {
    isPoint.value = false
    popupTitle.value = '영상안전보건교육'
    dATCA0020Popup.value.openPopup(val)
  } else {
    isPoint.value = true
    popupTitle.value = '영상안전교육'

    popupTitle.value = val.NOTICE_TITLE
    dATCA0020Popup.value.openPopup(val)
    // videoPopup.value.openPopup(val)
  }
}

const getContentImg = async (img) => {
  return new URL(`/src/assets/images/main/${img}`, import.meta.url).href
}

const selectedContents = ref(0)

const clickContentsPart = async (idx) => {
  selectedContents.value = idx

  let queryId = ''
  if (contentsList.value[idx].part === '영상안전보건교육') {
    queryId = 'MAINPAGE_SEARCH_04'
  } else if (contentsList.value[idx].part === '안전 컨텐츠') {
    queryId = 'MAINPAGE_SEARCH_05'
  } else {
    queryId = 'MAINPAGE_SEARCH_06'
  }

  /* ******************** 조회 ******************** */
  await commonRequest('/hse/data/DATCA0030_SEARCH_02', {
    queryId: queryId,
    param: { CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: userStore.userId },
  }).then((res) => {
    contentsList.value[0].list = res.ORESULT_CUR
    contentsList.value[idx].list = []

    res.ORESULT_CUR.forEach(async (item, index) => {
      contentsList.value[idx].list.push(item)
      let res2 = await commonSearchApi({
        queryId: 'searchFile',
        param: { CMPNY_DIV: item.CMPNY_DIV, FILE_ID: item.THUMBNAIL_FILE_ID },
      })
      await commonDownloadFilesApi(res2.ORESULT_CUR[0]).then((res3) => {
        const blob = new Blob([res3])
        const imageURL = URL.createObjectURL(blob)

        contentsList.value[0].list[index].img = imageURL
      })

      // .then(res2 => {
      //   commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(res3 => {
      //     const blob = new Blob([res3])
      //     const imageURL = URL.createObjectURL(blob)

      //     contentsList.value[0].list[index].img = imageURL
      //   })
      // })
    })

    // if(queryId === 'MAINPAGE_SEARCH_05') {
    //   let resTemp = []
    //   contentsList.value[idx].list.forEach(async data => {
    //     await commonSearchApi({
    //       queryId: "searchFile",
    //       param: { CMPNY_DIV: data.CMPNY_DIV, FILE_ID: data.NOTICE_FILEID },
    //     }).then(res4 => {
    //       console.log('searchFile 4',res4)
    //       res4.ORESULT_CUR.forEach((item2, imdex) =>{
    //         let fType = item2.FILE_NAME.split('.').pop().toUpperCase()
    //         if(fType === 'MP4') {
    //           data.FILE_INFO = item2
    //           resTemp.push(data)
    //           return
    //         }
    //       })
    //       console.log('resTemp', resTemp)
    //       contentsList.value[idx].list = []
    //       contentsList.value[idx].list = resTemp
    //       console.log('contentsList.value[idx]',contentsList.value[idx].list)
    //     })
    //   })
    // }
    contentsList.value[0].list = res.ORESULT_CUR
  })
}

// 콘텐츠 슬라이드
import 'vue3-carousel/dist/carousel.css'
import { Carousel, Slide } from 'vue3-carousel'
const contentsCarousel = ref(null)
const contentsAutoplay = ref(3000)
const clickContentsNav = (type) => {
  if (type === 'prev') {
    contentsAutoplay.value = contentsAutoplay.value ? contentsAutoplay.value : 2000
    contentsCarousel.value.prev()
    return
  }
  if (type === 'next') {
    contentsAutoplay.value = contentsAutoplay.value ? contentsAutoplay.value : 2000
    contentsCarousel.value.next()
    return
  }
  if (type === 'pause') {
    contentsAutoplay.value = null
    return
  }
}

const quickMenuClick = (e) => {
  if (e.path) {
    if (e.title === '나의 할 일') {
      oPRAB0010.value = true
    } else {
      commonStore.loading = true
      router.push(e.path).finally(() => {
        commonStore.loading = false
      })
    }
  } else if (e.title === '날씨') {
    weatherPopUp.value.openPopup()
  } else if (e.title === '승인ㆍ결재') {
    approvalPopup.value.openPopup()
  }
}

const openPopup3 = () => {
  personalProcessingPolicy.value.openPopup()
}

const closeVideoPopup = () => {
  clickContentsPart(1)
}
</script>

<template>
  <v-row no-gutters align-content="start" justify="center" class="homeView bg-white" @wheel="handleWheel">
    <!-- Main Carousel -->
    <v-col cols="12" id="fullPage" class="mainCarousel">
      <v-carousel
        cycle
        height="63vh"
        class="overflow-visible"
        :interval="3500"
        show-arrows
        hide-delimiter-background
        style="background-color: #000"
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
              <!-- @update:focused="e => {searchList.menuList = [] , search = ''}" -->
              <template v-slot:append-inner>
                <svg-icon name="mainSearch" class="mR-3 cursor-pointer" @click="onSearch" />
              </template>
            </v-text-field>
          </div>
          <v-sheet height="210" class="autoSearch px-5 pb-5" color="white">
            <v-divider />
            <v-row no-gutters="" class="autoWrap pT-10 pX-14" @wheel.stop>
              <v-col cols="3">
                <p class="f-16 w-600">{{ selected === 'M' ? '메뉴 ' : '자료실 ' }} 바로가기</p></v-col
              >
              <!-- *************** 메뉴 검색시 보여지는 부분 *************** -->
              <v-col cols="9" class="flex-column searchBox" v-if="selected === 'M'">
                <div class="d-flex">메뉴명</div>
                <v-divider class="pb-1" />
                <div
                  class="d-flex selectMenu"
                  v-for="item in searchList.menuList"
                  :key="item"
                  @click="
                    (e) => {
                      ;(commonStore.loading = true),
                        router.push(item.path).finally(() => {
                          commonStore.loading = false
                        })
                    }
                  "
                >
                  <!-- menuClick(item.path) -->
                  <span class="mr-2">
                    {{ item.mnu_nm }}
                  </span>
                  <svg-icon name="arrowR" />
                </div>
              </v-col>
              <!-- *************** 자료 검색시 보여지는 부분 *************** -->
              <v-col cols="9" class="flex-column searchBox" v-if="selected === 'F'">
                <div class="d-flex">자료명</div>
                <v-divider class="pb-1" />
                <div class="d-flex selectMenu" v-for="item in searchList.dataList" :key="item" @click="dataClick(item)">
                  <!-- <v-sheet width="80%" class="text-center">{{item.NOTICE_TITLE}}</v-sheet>
                <v-sheet class="h-auto text-center border">첨부</v-sheet> -->
                  <span class="mr-2">
                    {{ item.NOTICE_TITLE }}
                  </span>
                  <svg-icon name="arrowR" />
                </div>
              </v-col>
            </v-row>
          </v-sheet>
        </div>
        <template v-slot:prev="{ props }">
          <v-btn color="white" variant="plain" @click="props.onClick">PREV</v-btn>
        </template>
        <template v-slot:next="{ props }">
          <v-btn color="white" variant="plain" @click="props.onClick">NEXT</v-btn>
        </template>

        <v-carousel-item v-for="(item, i) in imgData" :key="i" transition="fade">
          <v-row no-gutters class="fill-height text-center">
            <v-col cols="12">
              <p v-html="item.slogan" class="ma-0 pa-0 carouselInnerText"></p>
              <v-img width="100%" height="100%" cover :src="CarouselImg[item.img]" class="imgStyle"
            /></v-col>
          </v-row>
        </v-carousel-item>
      </v-carousel>

      <!-- quickMenu 영역 -->
      <v-sheet width="1280">
        <v-row no-gutters class="align-center">
          <v-col cols="3" v-for="(menu, i) in quickMenu" :key="i" class="d-flex flex-column align-center text-center">
            <!-- <div class="quickMenu" @click="e => {if(menu.path){ commonStore.loading = true , router.push(menu.path)}}"> -->
            <div class="quickMenu" @click="quickMenuClick(menu)">
              <div v-if="menu.title === '나의 할 일' && oprLength > 0" class="APPROVAL_CNT">
                <v-btn color="red" rounded class="APPROVAL_CNT_BTN">{{ oprLength }}</v-btn>
              </div>
              <div v-if="menu.title === '승인ㆍ결재' && appLength > 0" class="APPROVAL_CNT">
                <v-btn color="red" rounded class="APPROVAL_CNT_BTN">{{ appLength }}</v-btn>
              </div>
              <svg-icon :name="menu.src" />
              <p class="mainTitle fw-600 pt-3 text-textMain">
                {{ menu.title }}
              </p>
            </div>
            <p class="mainCaption2 text-textCaption pt-3" style="white-space: pre-line">
              {{ menu.caption }}
            </p>
          </v-col>
        </v-row>
      </v-sheet>

      <div class="mt-4 pb-3 scrollDown text-textMain">
        <span>scroll down</span>
        <div class="arrow">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </v-col>

    <!-- 주요 대시보드 영역 -->
    <v-col cols="12" id="fullPage" class="dashBoardSection bg-mainBg">
      <v-sheet width="1280" color="mainBg">
        <v-row no-gutters>
          <v-col cols="6" class="d-flex align-center">
            <div class="d-flex flex-column align-start">
              <p class="f-48 w-700 text-textMain">주요 대시보드</p>
              <p class="mT-20 f-20 w-400 text-textCaption">
                주요 대시보드를 통해 <br />
                조직별 다양한 정보를 쉽고 빠르게 확인하세요.
              </p>
              <v-btn color="primary" variant="plain" class="moreBtn">
                <div class="bar" style="width: 120px"></div>
                <p class="mainCaption7">MORE</p>
              </v-btn>
            </div>
          </v-col>
          <v-col cols="6" class="dashboardCardWrap" @wheel.stop="scrollDashboard">
            <v-card
              v-for="(item, idx) in dashBoard"
              :key="idx"
              class="dashboardCard"
              color="primary"
              @click="clickDashboardCard(item)"
              @wheel.stop
            >
              <p class="text-textIndex f-20 w-700">
                {{ `${idx < 9 ? 0 : ''}${idx + 1}.` }}
              </p>
              <p class="f-28 w-700 text-white">{{ item.title }}</p>
              <p v-if="item.sub" class="mT-32 f-15 w-400" style="color: rgba(255, 255, 255, 0.7)">
                {{ item.sub }}
              </p>
              <svg-icon name="arrow-right" />
            </v-card>
          </v-col>
        </v-row>
      </v-sheet>
    </v-col>

    <!-- NOTICE 영역 -->
    <v-col cols="12" id="fullPage" class="noticeSection">
      <p class="f-48 w-700 text-textMain">NOTICE</p>
      <v-list width="1280" height="670" @wheel.stop>
        <v-list-item v-for="item in NoticeList" :key="item" :ripple="false" @click="clickNotice(item)">
          <div class="d-flex align-center justify-space-between">
            <v-sheet class="text-textGrey text-center" width="15%">
              <span class="f-44 w-500">{{ item.INSERT_DATE.slice(8, 10) }}</span
              ><br />
              <span class="f-20 w-500">{{ item.INSERT_DATE.slice(0, 7) }}</span>
            </v-sheet>
            <v-sheet class="listText" width="75%">
              <div class="text-primary f-24 w-500 d-flex">
                <v-chip color="primary" rounded="0" variant="outlined" size="large" class="f-20">공지</v-chip>
                <p class="listTitle">
                  {{ item.NOTICE_TITLE }}
                </p>
              </div>
              <p class="text-textCaption text-truncate f-20 w-400">
                {{ item.NOTICE_NOTE_NO_HTML }}
              </p>
            </v-sheet>
            <v-sheet>
              <v-btn color="primary" variant="plain" class="moreBtn">
                <div class="bar" style="width: 100px"></div>
                <p class="mainCaption7">MORE</p>
              </v-btn>
            </v-sheet>
          </div>
        </v-list-item>
      </v-list>
      <v-btn variant="plain" class="f-20 w-500 listBtn" @click="clickNoticeList"
        ><svg-icon name="list" class="mr-4" />LIST</v-btn
      >
    </v-col>

    <!-- 콘텐츠 자료 영역 -->
    <v-col cols="12" id="fullPage" class="contentsSection">
      <v-sheet class="contentsWrap" width="1280">
        <div class="d-flex flex-column justify-space-between">
          <p class="text-textMain f-48 w-700">
            다양한 {{ userStore.companyNm }}<br />
            <span class="text-textContents">콘텐츠 자료</span>
          </p>
          <section class="partBtnWrap">
            <div v-for="(item, idx) in contentsList" :key="item.part">
              <v-btn
                variant="plain"
                class="partBtn f-20"
                :class="selectedContents === idx ? 'text-textMain w-600 selected' : ' text-textGrey w-400'"
                @click="clickContentsPart(idx)"
              >
                <v-icon color="primary" v-show="selectedContents === idx">mdi-circle-medium</v-icon>
                {{ item.part }}
                <img :src="youtubeLogo" height="30px" class="pa-1 pb-0" v-if="idx === 2" />
              </v-btn>
            </div>
          </section>
        </div>
        <section class="contentsCarouselContainer">
          <carousel
            ref="contentsCarousel"
            class="contentsCarousel"
            :autoplay="contentsAutoplay"
            :items-to-show="
              contentsList[selectedContents].list.length < 2 ? contentsList[selectedContents].list.length : 3
            "
            :snap-align="'start'"
            :wrap-around="true"
          >
            <slide v-for="item in contentsList[selectedContents].list" :key="item.NOTICE_TITLE" class="contentsSlide">
              <v-card class="contentsCard" @click="contentsSelect(item)">
                <v-img v-if="item.img" :src="item.img" height="230" />
                <!-- <v-img v-if="item.img" :src="getContentImg(item.img)" /> -->
                <div class="cardText">
                  <p class="text-textMain f-20 w-500">
                    {{ item.NOTICE_TITLE }}
                    <!-- <span v-if="item.POINT" class="pl-2">
                      <v-chip
                        :color="item.CHIPCOLOR"
                        variant="flat"
                        size="small"
                        class="px-2"
                        >
                        {{ item.POINT }} P
                      </v-chip>
                    </span> -->
                  </p>
                  <p class="text-textCaption f-14 w-400 mT-32">
                    {{ dayjs(item.INSERT_DATE).format('YYYY.MM.DD') }}
                  </p>
                </div>
              </v-card>
            </slide>
          </carousel>
          <div class="carouselNav">
            <v-btn icon variant="text" density="comfortable"
              ><svg-icon name="prev" @click="clickContentsNav('prev')" />
            </v-btn>
            <v-btn icon variant="text" density="comfortable"
              ><svg-icon name="next" @click="clickContentsNav('next')" />
            </v-btn>
            <v-btn icon variant="text" density="comfortable" :disabled="!contentsAutoplay"
              ><svg-icon name="pause" @click="clickContentsNav('pause')" />
            </v-btn>
          </div>
        </section>
      </v-sheet>
    </v-col>

    <!-- SLI 영역 -->
    <v-col cols="12" id="fullPage" class="sliSection" :class="{ show: currentPageIndex === 4 }">
      <section class="sliBg">
        <div class="bg-mainBg leftBg"></div>
        <div class="rightBg"></div>
      </section>
      <v-sheet width="1420" class="sliContents" color="transparent">
        <section class="leftWrap">
          <p class="text-textMain f-48 w-700 ml-4">SLI</p>
          <div class="d-flex justify-space-between">
            <div class="mr-3">
              <v-btn color="primary" variant="plain" class="moreBtn mr-6">
                <div class="bar" style="width: 120px"></div>
                <p class="mainCaption7">MORE</p>
              </v-btn>
            </div>
            <div class="customBarChart">
              <template v-for="item in sliList" :key="item">
                <div :style="customBarStyle(item)">
                  <p class="barValue text-white f-24 w-800">{{ item.val }}</p>
                  <p class="barType f-20 w-400">{{ item.type }}</p>
                </div>
              </template>
            </div>
          </div>
        </section>
        <section class="rightWrap">
          <!-- <div class="rightContents"> -->
          <p class="text-textMain f-48 w-700">당신의 아이디어를 삽니다</p>
          <p class="textCaption f-20 w-400 mT-44">
            Safety Open Market 게시판을 통해<br />
            다양한 아이디어 공모 리스트를 확인하세요.
          </p>
          <v-btn color="primary" variant="plain" class="moreBtn" @click="sliPageMove">
            <div class="bar" style="width: 120px"></div>
            <p class="mainCaption7">MORE</p>
          </v-btn>
          <!-- </div> -->
        </section>
      </v-sheet>
    </v-col>

    <!-- 모바일 앱 이용안내 영역 -->
    <v-col cols="12" id="fullPage" class="mobileSection">
      <v-sheet width="1280" height="100%">
        <v-row no-gutters class="h-full">
          <v-col cols="6" class="leftWrap align-center">
            <section class="textWrap">
              <div>
                <p class="text-textMain f-48 w-700">모바일 앱 이용안내</p>
                <p class="textCaption f-20 w-400">
                  현장에서 쉽게 안전보건정보를 조회하고 <br />
                  활동을 기록할 수 있습니다
                </p>
              </div>
              <!-- <v-img :src="getContentImg('mobileQR.png')"  /> -->
            </section>
            <div class="appBtnWrap">
              <!-- <v-btn size="x-large" rounded="lg" variant="flat" color="white">
              </v-btn> -->
              <div class="ma-2">
                <v-img :src="appStore" width="147px" />
                <v-img :src="iosqrcode" width="130px" class="pa-2" />
              </div>
              <!-- <v-btn size="x-large" rounded="lg" variant="flat" color="white">
              </v-btn> -->
              <div class="ma-2">
                <v-img :src="googlePlay" width="147px" />
                <v-img :src="androidqrcode" width="130px" class="pa-2" />
              </div>
            </div>
          </v-col>
          <v-col cols="6">
            <v-img :src="mobileApp" contain width="100%" height="100%" />
          </v-col>
        </v-row>
      </v-sheet>

      <!-- 👉 Footer -->
      <DefaultFooter @click="openPopup3" />
    </v-col>
  </v-row>

  <!-- 팝업 -->
  <!-- <VDialog
    persistent
    scrim
    v-model="noticeDialog"
    class="mainPopup"
    width="1000"
    max-height="730"
    :no-click-animation="true"
  >
    <v-card variant="flat" rounded="0" color="white" width="1000px" height="80vh">
      <div class="d-flex flex-column justify-space-between" style="height: 100%">
        <v-carousel class="popupCarousel" hide-delimiters height="100%" :continuous="false">
          <template v-slot:prev="{ props }">
            <v-btn width="36" height="36">
              <v-icon color="primary" size="x-large" icon="mdi-chevron-left" @click="props.onClick"></v-icon>
            </v-btn>
          </template>
          <template v-slot:next="{ props }">
            <v-btn width="36" height="36">
              <v-icon color="primary" size="x-large" icon="mdi-chevron-right" @click="props.onClick"></v-icon>
            </v-btn>
          </template>
          <v-carousel-item v-for="(notice, index) in noticeArray" :key="index" cover>
            <NoticeInfo :notice-info-array="notice" />
          </v-carousel-item>
        </v-carousel>
        <v-sheet color="primarySub" class="d-flex justify-space-between pX-32 pY-12">
          <div class="d-flex">
            <VCheckbox
              true-value="Y"
              false-value="N"
              small
              v-model="oneDayCookieCheckBoxValue"
              color="white"
              label="하루동안 이 창을 열지 않음"
            />
            <VCheckbox
              true-value="Y"
              false-value="N"
              small
              v-model="threeDayCookieCheckBoxValue"
              color="white"
              label="3일 동안 이 창을 열지 않음"
              class="ml-2"
            />
          </div>
          <v-btn variant="text" class="text-white" @click="closeNoticeInfo">
            <span class="pR-10 f-16 w-700" @mouseover="mouseover" @click="closeNoticeInfo" id="closeButton">닫기</span>
            <svg-icon name="close" />
          </v-btn>
        </v-sheet>
      </div>
    </v-card>
  </VDialog> -->
  <!-- #####공지사항 화면그리기 끝#####-->

  <v-dialog v-model="oPRAB0010" eager persistent width="1400" height="870" class="p-absolute user-select-none">
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move">
      <span>나의 할 일</span>
    </v-sheet>
    <!-- 일정/업무 팝업 -->
    <OPRAB0010 :isTitle="false" :btnList="['btnSearch', 'btnClose']" @close="oPRAB0010 = false" :hiddenManuel="true" />
  </v-dialog>

  <!-- 날씨 팝업 -->
  <WeatherPopUp ref="weatherPopUp" />

  <!-- 승인 결재 팝업 -->
  <ApprovalPopup ref="approvalPopup" :appList="appList" />

  <DATAPopup :id="'index'" ref="dATAPopup" />
  <OPRAJ0010Popup
    :id="NOTICE_NO"
    ref="oPRAJ0010Popup"
    :isReadonly="true"
    :buttonList="['btnClose']"
    :fileUploadButton="['btnDownLoad']"
    :title="'공지사항'"
  />
  <DATCA0020Popup
    :id="contentsID"
    ref="dATCA0020Popup"
    :isReadonly="true"
    :btnList="['btnClose']"
    :fileBtnList="['btnDownLoad']"
    :title="popupTitle"
    :isPoint="isPoint"
  />
  <DATCA0020Popup2
    :id="contentsID"
    ref="dATCA0020Popup2"
    :isReadonly="true"
    :btnList="['btnClose']"
    :fileBtnList="['btnDownLoad']"
    :title="'유튜브 쇼츠'"
  />
  <VideoPopup id="999" ref="videoPopup" :btnList="['btnClose']" @close-video-popup="closeVideoPopup" />
  <!-- 개인정보처리방침 -->
  <PersonalProcessingPolicy ref="personalProcessingPolicy" />
  <MessagePopup ref="message1"></MessagePopup>
  <MessagePopup ref="message2"></MessagePopup>
  <OPRAJ0010Popup03 ref="noticePopup" />
</template>

<style lang="scss" scoped>
// 메인 팝업
.mainPopup {
  > .v-overlay__content {
    justify-content: center;
    align-items: center;
  }

  .popupWrap {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    .popupContents {
      height: 100%;
    }
  }

  .closeRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .v-checkbox .v-label {
    color: #fff;
  }
  .v-selection-control {
    // 체크박스 레이아웃
    justify-content: center;
  }
  .v-btn--size-default {
    // 전체선택 버튼
    padding: 0 12px !important;
  }
  .v-selection-control--density-compact.v-checkbox-btn {
    margin-left: 0;
  }
}
.popupCarousel {
  .v-window__controls {
    padding: 0;
    .v-btn {
      width: 40px;
      height: 40px;
      box-shadow: none;
      background-color: unset !important;
      color: var(--v-theme-primary) !important;
      margin-left: 0;
      .v-btn__overlay {
        opacity: 0;
      }
      &:hover {
        background-color: unset;
      }
    }
  }
}
.fileTableContainer {
  .fileTable {
    .v-table__wrapper > table > tbody > tr > td {
      border-right: 1px solid #e6e6e6;
      border-bottom: 1px solid #e6e6e6;
    }
    .v-table__wrapper > table > tbody > tr:first-child > td {
      border-top: 1px solid #e6e6e6;
    }
    .v-table__wrapper > table > tbody > tr > td:first-child {
      border-left: 1px solid #e6e6e6;
    }
    .checked {
      background: #e9edf9;
    }
  }
  .v-btn {
    width: 20px;
    height: 20px;
    .v-btn__content {
      color: #d9d9d9;
    }
    &.v-btn--active .v-btn__content {
      color: #1d43ca;
    }

    .v-btn__overlay {
      opacity: 0 !important;
    }
  }
}
.searchBox {
  overflow-y: auto;
  max-height: 130px;
  :hover {
    background-color: #f4f5f9;
  }
}
.selectMenu {
  cursor: pointer;
}

::v-deep(.v-label) {
  color: white !important;
}
.APPROVAL_CNT {
  position: absolute;
  margin-left: 2px;
  margin-top: -12px;
  z-index: 1;
}

.APPROVAL_CNT_BTN {
  font-weight: bold !important;
  font-weight: 700 !important;
}

.imgStyle {
  width: 100%;
  height: 100vh;
  object-fit: cover;
  opacity: 0.6;
}
</style>

<route lang="yaml">
meta:
  noAuth: true
</route>
