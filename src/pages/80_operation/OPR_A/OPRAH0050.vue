<!--
  화면명 : 설문조사
  화면개요 : 설문조사를 하는 페이지
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'

defineOptions({
  name: '60_edu-EDU_A-EDUAA0030',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const searchArea = ref(null)
const suvyTitle = ref(null) //설문지 제목
const suvyCurrNm = ref(null) //설문지 교육명
const btnVisible = ref(false) //버튼 사용유무
const _Parameters = reactive({
  CMPNY_DIV: '',
  SCHEDULE_ID: '',
  EDUTIME_SERIAL: '',
  YEAR: '',
  TARGET_KEY: '',
  CURR_ID: '',
  DIVISION: '',
  SUVY_ID: '',
})
let clickedRowIndex = ''
let openCheck = reactive({})

//선택된 단일 선택 데이터
const selectRadio = reactive({})

//선택된 선호도 데이터
const selectPreference = reactive({})

//선택된 복수 선택 데이터
const selectChecks = reactive({})

const isHidden1 = ref(true)

// 주간식 단답
const inputParam = reactive({
  el: [],
})

// 주간식 서술
const textParam = reactive({
  el: [],
})

// 파일첨부
const fileParam = reactive({
  el: [],
})

// 단일 선택
const singleSelParam = reactive({
  el: [],
})

//단일 선택 타이틀
const singleSelTitle = reactive({
  el: [],
})

// 복수 선택
const multiSelParam = reactive({
  el: [],
})

//복수 선택 타이틀
const multiSelTitle = reactive({
  el: [],
})

// 선호도
const preferenceParam = reactive({
  el: [],
})

const preferenceTitle = reactive({
  el: [],
})

//코드 리스트 세팅
const codeList = ref({
  YN: [
    //삭제, 퇴직 여부
    { TXT: 'Y', COD: 'Y' },
    { TXT: 'N', COD: 'N' },
  ],
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const openPage = (data) => {
  let urlParams = userStore.url.split('&')
  urlParams.forEach((val) => {
    val = val.split('=')
    if (val[0] === 'CMPNY_DIV') {
      _Parameters.CMPNY_DIV = val[1]
    } else if (val[0] === 'SCHEDULE_ID') {
      _Parameters.SCHEDULE_ID = val[1]
    } else if (val[0] === 'EDUTIME_SERIAL') {
      _Parameters.EDUTIME_SERIAL = val[1]
    } else if (val[0] === 'YEAR') {
      _Parameters.YEAR = val[1]
    } else if (val[0] === 'TARGET_KEY') {
      _Parameters.TARGET_KEY = val[1]
    } else if (val[0] === 'CURR_ID') {
      _Parameters.CURR_ID = val[1]
    } else if (val[0] === 'DIVISION') {
      _Parameters.DIVISION = val[1]
    } else if (val[0] === 'SUVY_ID') {
      _Parameters.SUVY_ID = val[1]
    } else if (val[0] === 'SUVY_TITLE') {
      suvyTitle.value = decodeURIComponent(val[1])
    }
  })
  console.log('파라미터 확인', _Parameters)

  commonSearchApi({
    queryId: 'EDUAD0010_SEARCH_05',
    param: { CMPNY_DIV: _Parameters.CMPNY_DIV, DIVISION: _Parameters.DIVISION },
  }).then((res) => {
    console.log('교육명 조회 :::: >>>>', res)
    let currIdx = res.ORESULT_CUR.findIndex(
      (val) => val.COD === _Parameters.CURR_ID
    )
    suvyCurrNm.value = '교육명 : ' + res.ORESULT_CUR[currIdx].TXT
    console.log('설문지 교육명 확인!', suvyCurrNm.value)
  })

  commonSearchApi({
    queryId: 'OPRAH0010_SEARCH_03',
    param: { SUVY_ID: _Parameters.SUVY_ID },
  }).then((res) => {
    var resVal = res.ORESULT_CUR
    console.log('레스 확인 :::: >>>>', resVal)
    isHidden1.value = false

    for (let i = 0; i < resVal.length; i++) {
      if (resVal[i].QSTN_TYPE === 'A') {
        /////////////////////////////////////주간식 단답
        console.log('i확인', resVal[i])
        inputParam.el.push({
          TITLE: resVal[i].QSTN_TITLE,
          DESC: resVal[i].QSTN_DESC,
          DESCRIPTION: resVal[i].QSTN_CONTENTS,
        })
        console.log('인풋 파람 확인', inputParam)
      } else if (resVal[i].QSTN_TYPE === 'B') {
        ////////////////////////////////주간식 서술
        textParam.el.push({
          TITLE: resVal[i].QSTN_TITLE,
          DESC: resVal[i].QSTN_DESC,
          DESCRIPTION: resVal[i].QSTN_CONTENTS,
        })
        console.log('텍스트 파람 확인', textParam)
      } else if (resVal[i].QSTN_TYPE === 'C') {
        ////////////////////////////////파일 첨부
        Promise.all([
          commonSearchApi({
            queryId: 'searchFile',
            param: {
              CMPNY_DIV: userStore.cmpnyDiv,
              FILE_ID: resVal[i].QSTN_CONTENTS,
            },
          }),
        ]).then((res) => {
          test(res[0].ORESULT_CUR, 'C')
        })
      } else if (resVal[i].QSTN_TYPE === 'D') {
        ////////////////////////////////단일 선택
        let radioValue = []
        let valSplit1 = resVal[i].QSTN_CONTENTS.split('|')
        for (let i = 0; i < valSplit1.length; i++) {
          let valSplit2 = valSplit1[i].split('&')
          radioValue.push({ value: valSplit2[1], label: valSplit2[0] })
        }
        let filterValue = radioValue.filter((el) => el !== '')
        console.log(
          '필터밸류@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ : ',
          filterValue
        )
        singleSelParam.el.push(filterValue)
        singleSelTitle.el.push({
          TITLE: resVal[i].QSTN_TITLE,
          DESC: resVal[i].QSTN_DESC,
        })
      } else if (resVal[i].QSTN_TYPE === 'E') {
        ////////////////////////////////복수 선택
        let checkValue = []
        let valSplit1 = resVal[i].QSTN_CONTENTS.split('|')
        for (let i = 0; i < valSplit1.length; i++) {
          let valSplit2 = valSplit1[i].split('&')
          checkValue.push({ value: valSplit2[1], label: valSplit2[0] })
        }
        multiSelParam.el.push(checkValue)
        multiSelTitle.el.push({
          TITLE: resVal[i].QSTN_TITLE,
          DESC: resVal[i].QSTN_DESC,
        })
        console.log('멀티 셀렉 파람 확인', multiSelParam.el)
        for (let i = 0; i < multiSelTitle.el.length; i++) {
          selectChecks[i] = []
        }
      } else if (resVal[i].QSTN_TYPE === 'F') {
        ////////////////////////////////선호도
        let splitValue = resVal[i].QSTN_CONTENTS.split('&')
        let range = []
        for (let i = splitValue[0]; i < Number(splitValue[1]) + 1; i++) {
          range.push({ value: String(i) })
        }
        console.log('랜지밸류@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ : ', range)
        preferenceParam.el.push(range)
        console.log('선호도 확인', preferenceParam.el)
        console.log('선호도 제목', preferenceTitle.el)
        preferenceTitle.el.push({
          TITLE: resVal[i].QSTN_TITLE,
          DESC: resVal[i].QSTN_DESC,
        })
      }
      btnVisible.value = true
    }
  })
}

const radioClick = () => {
  console.log('라디오 버튼 클릭함', selectRadio)
}

const checkBoxClick = () => {
  console.log('체크박스 클릭함', selectChecks)
}

// 이미지 첨부 파일 미리보기용
const test = async (imgpreview, type) => {
  if (imgpreview) {
    for (let i of imgpreview) {
      await commonDownloadFilesApi(i).then((res) => {
        const contentDisposition = res.contentDisposition
        const fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        const blob = new Blob([res])
        const imageURL = URL.createObjectURL(blob)

        const img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName // 이미지의 대체 텍스트 설정 (파일 이름 등)

        if (type === 'C') {
          const newElement = {
            addfile: imageURL,
          }

          fileParam.el.push(newElement)
        } else if (type === 'D') {
          const newElement = {
            description1: i.DESC1,
            description2: i.DESC2,
            addfile: imageURL,
          }

          singleSelParam.el.push(newElement)
        } else if (type === 'E') {
          const newElement = {
            description1: i.DESC1,
            description2: i.DESC2,
            addfile: imageURL,
          }
          multiSelParam.el.push(newElement)
        }
      })
    }
  } else {
    return
  }
}

const spanClick = (data) => {
  let clickedX = event.clientX - event.target.getBoundingClientRect()
  const rect = this.$refs.target.getBoundingClientRect()
  console.log('클릭드 X', rect)
  console.log('스팬 클릭', data)
}

//작성완료 버튼 클릭 시
const onBtnSave = () => {
  console.log('저장버튼 누름!')
  console.log('인풋파람확인!', inputParam)
}
//*************************************이벤트 영역(종료)******************************************************/
onMounted(() => {
  openPage()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle ref="menuTitle" :title="$t('설문조사')" />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                  만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet
          height="100%"
          width="100%"
          class="mb-2"
          style="align-content: space-between"
        >
          <!--주간식 단답------------------------------------------------------------------->
          <h1 class="mt-2">
            {{ suvyTitle }}
          </h1>
          <h2 class="mt-2">
            {{ suvyCurrNm }}
          </h2>
          <br />
          <br />
          <div v-for="(value, index) in inputParam.el" :key="index">
            <h2 v-if="!isHidden1" class="mt-2 mb-2">
              {{ value.TITLE }}
            </h2>
            <span>{{ value.DESC }}</span>
            <v-sheet width="30%">
              <i-input v-model="value.DESCRIPTION" class="mb-6 searchArea" />
            </v-sheet>
          </div>
          <!--주간식 서술------------------------------------------------------------------->
          <div v-for="(value, index) in textParam.el" :key="index">
            <h2>
              {{ value.TITLE }}
            </h2>
            <span>{{ value.DESC }}</span>
            <v-sheet width="30%">
              <v-textarea
                v-model="value.DESCRIPTION"
                class="mt-2 searchArea mb-6"
              />
            </v-sheet>
          </div>
          <!--파일 첨부------------------------------------------------------------------->
          <div v-for="(value, index) in fileParam.el" :key="index">
            <div
              class="d-flex fill-height align-center justify-center"
              style="height: 20%; width: 20%"
            >
              <v-scale-transition>
                <v-img :src="value.addfile" />
              </v-scale-transition>
            </div>
          </div>
          <!--단일 선택------------------------------------------------------------------->
          <div
            v-for="(value, index) in singleSelTitle.el"
            :key="index"
            class="mt-2 mb-6"
          >
            <h2 class="mt-2 mb-2">
              {{ value.TITLE }}
            </h2>
            <span>{{ value.DESC }}</span>
            <v-sheet class="searchArea" width="30%">
              <v-radio-group v-model="selectRadio[index]">
                <v-radio
                  v-for="(radio, idx) in singleSelParam.el[index]"
                  :key="idx"
                  :value="radio.value"
                  :label="radio.label"
                  @change="radioClick"
                />
              </v-radio-group>
            </v-sheet>
          </div>
          <!--복수 선택------------------------------------------------------------------->
          <div
            v-for="(value, index) in multiSelTitle.el"
            :key="index"
            class="mt-2 mb-6"
          >
            <h2 class="mt-2 mb-2">
              {{ value.TITLE }}
            </h2>
            <span>{{ value.DESC }}</span>
            <v-sheet class="searchArea" width="30%">
              <v-checkbox
                v-for="(check, idx) in multiSelParam.el[index]"
                :key="idx"
                v-model="selectChecks[index][idx]"
                :value="check.value"
                :label="check.label"
                @change="checkBoxClick"
              />
            </v-sheet>
          </div>
          <!--선호도 --------------------------------------------------------------------->
          <div
            v-for="(value, index) in preferenceTitle.el"
            :key="index"
            class="mt-2 mb-6"
          >
            <h2 class="mt-2 mb-2">
              {{ value.TITLE }}
            </h2>
            <span>{{ value.DESC }}</span>
            <v-sheet class="d-flex searchArea" width="17%">
              <span class="mr-2 mt-1"> 낮음 </span>
              <v-radio-group v-model="selectPreference[index]" inline>
                <v-radio
                  v-for="(radio, idx) in preferenceParam.el[index]"
                  :key="idx"
                  :value="radio.value"
                  @change="radioClick"
                />
              </v-radio-group>
              <span class="mr-2 mt-1"> 높음 </span>
            </v-sheet>
          </div>
          <div
            class="mt-10"
            style="display: flex; justify-content: flex-end"
            v-if="btnVisible === true"
          >
            <v-btn size="x-large" @click="onBtnSave">작성완료</v-btn>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>

<!--경로만 존재하면 로그인 없이 바로 이 페이지로 이동 가능-->
<route lang="yaml">
meta: { noAuth: true }
</route>
