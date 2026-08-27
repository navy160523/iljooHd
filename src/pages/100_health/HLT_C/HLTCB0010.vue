<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import image1 from '@/assets/images/dashboard/HLT_DASHBOARD_1.png'
import image2 from '@/assets/images/dashboard/HLT_DASHBOARD_2.png'
import image3 from '@/assets/images/dashboard/HLT_DASHBOARD_3.png'
import image4 from '@/assets/images/dashboard/HLT_DASHBOARD_4.png'
import image5 from '@/assets/images/dashboard/HLT_DASHBOARD_5.png'
import image6 from '@/assets/images/dashboard/HLT_DASHBOARD_6.png'
import image7 from '@/assets/images/dashboard/HLT_DASHBOARD_7.png'
import image8 from '@/assets/images/dashboard/HLT_DASHBOARD_8.png'
import HLTCB0010_01 from '../HLT_C/HLTCB0010_01.vue'
import HLTCB0010_02 from '../HLT_C/HLTCB0010_02.vue'
import HLTCB0010_03 from '../HLT_C/HLTCB0010_03.vue'
import HLTCB0010_04 from '../HLT_C/HLTCB0010_04.vue'
import HLTCB0010_05 from '../HLT_C/HLTCB0010_05.vue'
import HLTCB0010_06 from '../HLT_C/HLTCB0010_06.vue'
import HLTCB0010_07 from '../HLT_C/HLTCB0010_07.vue'
import HLTCB0010_08 from '../HLT_C/HLTCB0010_08.vue'
import HLTCB0010_09 from '../HLT_C/HLTCB0010_09.vue'
import HLTCB0010_10 from '../HLT_C/HLTCB0010_10.vue'
import HLTCB0010_11 from '../HLT_C/HLTCB0010_11.vue'
import HLTCB0010_12 from '../HLT_C/HLTCB0010_12.vue'
import HLTCB0010_13 from '../HLT_C/HLTCB0010_13.vue'
import HLTCB0010_14 from '../HLT_C/HLTCB0010_14.vue'
import HLTCB0010_15 from '../HLT_C/HLTCB0010_15.vue'
import HLTCB0010_16 from '../HLT_C/HLTCB0010_16.vue'
import HLTCB0010_17 from '../HLT_C/HLTCB0010_17.vue'
import HLTCB0010_18 from '../HLT_C/HLTCB0010_18.vue'
import HLTCB0010_19 from '../HLT_C/HLTCB0010_19.vue'
import HLTCB0010_20 from '../HLT_C/HLTCB0010_20.vue'
import HLTCB0010_21 from '../HLT_C/HLTCB0010_21.vue'
import HLTCB0010_22 from '../HLT_C/HLTCB0010_22.vue'
import HLTCB0010_23 from '../HLT_C/HLTCB0010_23.vue'
import HLTCB0010_24 from '../HLT_C/HLTCB0010_24.vue'
import HLTCB0010_25 from '../HLT_C/HLTCB0010_25.vue'
import HLTCB0010_26 from '../HLT_C/HLTCB0010_26.vue'
import HLTCB0010_27 from '../HLT_C/HLTCB0010_27.vue'
import _ from 'lodash'
import dayjs from 'dayjs'

defineOptions({
  name: '100_health-HLT_C-HLTCB0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const activeSheet = ref(null)
const perHealthData = ref(null) //시트 클릭 했을때 조회되는 값들
const model = ref(null)
const clickedSheet = ref(null)
const month = new Date().getMonth() + 1 // 1~12
const quarter = Math.ceil(month / 3) // 1~4
let ifValue = ref('default') //기본값

const codeList = reactive({
  CODE_LIST: [],
  CODE_LIST2: [],
  CONCATED_ARRAY: [],
})

const sheetValue = reactive({
  sheetA: [],
  sheetB: [],
  sheetC: [],
  sheetD: [],
  sheetE: [],
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIIO')]).then((res) => {
    codeList.CODE_LIST = res[0].ORESULT_CUR
    setSheet('A')
  })
}

const checkAuthFlag = reactive({
  GROUP_A: false, //보건관리과(보건지표모듈 관리자 HLTC001)
  GROUP_B: false, //부서장,직책과장
  GROUP_C: false, //일반직원
})

const initSheet = (A) => {
  sheetAColor.style.color = '#FFFFFF'
  sheetAColor.style.border = ''
}

const setSheet = (id) => {
  const sheetAColor = document.getElementById('A') //건강행태
  const sheetBColor = document.getElementById('B') //보건의료서비스
  const sheetCColor = document.getElementById('C') //보건자원및기타
  const sheetDColor = document.getElementById('D') //건강상태
  const sheetEColor = document.getElementById('E') //산업보건
  if (id === 'A') {
    sheetAColor.style.color = '#1A40C7'
    sheetAColor.style.border = '2px solid #1A40C7'
    sheetBColor.style.color = '#000000'
    sheetBColor.style.border = ''
    sheetCColor.style.color = '#000000'
    sheetCColor.style.border = ''
    sheetDColor.style.color = '#000000'
    sheetDColor.style.border = ''
    sheetEColor.style.color = '#000000'
    sheetEColor.style.border = ''
  } else if (id === 'B') {
    //시트 스타일 변경
    sheetBColor.style.color = '#1A40C7'
    sheetBColor.style.border = '2px solid #1A40C7'
    //시트 스타일 초기화
    sheetAColor.style.color = '#000000'
    sheetAColor.style.border = ''
    sheetCColor.style.color = '#000000'
    sheetCColor.style.border = ''
    sheetDColor.style.color = '#000000'
    sheetDColor.style.border = ''
    sheetEColor.style.color = '#000000'
    sheetEColor.style.border = ''
  } else if (id === 'C') {
    sheetCColor.style.color = '#1A40C7'
    sheetCColor.style.border = '2px solid #1A40C7'
    sheetAColor.style.color = '#000000'
    sheetAColor.style.border = ''
    sheetBColor.style.color = '#000000'
    sheetBColor.style.border = ''
    sheetDColor.style.color = '#000000'
    sheetDColor.style.border = ''
    sheetEColor.style.color = '#000000'
    sheetEColor.style.border = ''
  } else if (id === 'D') {
    sheetDColor.style.color = '#1A40C7'
    sheetDColor.style.border = '2px solid #1A40C7'
    sheetBColor.style.color = '#000000'
    sheetBColor.style.border = ''
    sheetAColor.style.color = '#000000'
    sheetAColor.style.border = ''
    sheetCColor.style.color = '#000000'
    sheetCColor.style.border = ''
    sheetEColor.style.color = '#000000'
    sheetEColor.style.border = ''
  } else {
    sheetEColor.style.color = '#1A40C7'
    sheetEColor.style.border = '2px solid #1A40C7'
    sheetAColor.style.color = '#000000'
    sheetAColor.style.border = ''
    sheetBColor.style.color = '#000000'
    sheetBColor.style.border = ''
    sheetDColor.style.color = '#000000'
    sheetDColor.style.border = ''
    sheetCColor.style.color = '#000000'
    sheetCColor.style.border = ''
  }

  activeSheet.value = id

  let code = codeList.CODE_LIST.find((x) => x.COD === activeSheet.value)

  clickedSheet.value = code.TXT

  getCodeList(`HHIIO${code.COD}`).then((res) => {
    /*2025.09.24 김현재 작성  안전보건지원부 염동희매니저 요청으로
          건강행태 - 고강도 운동 실천율 A05
          건강행태 - 고위험 음주율 A06
          은 나중에 개발한다고해서 안보이게 숨겨놓음
  */
    const excludedCodes = ['A05', 'A06', 'E02', 'E04', 'E06', 'E08', 'E10']
    //보건관리과가 아니면 직업병 요관찰율, 직업병 유소견율, 업무상질병 발생율 안보여줌
    if (checkAuthFlag.GROUP_A === false) {
      excludedCodes.push('E05')
      excludedCodes.push('E07')
      excludedCodes.push('E09')
    }
    let tempCode = res.ORESULT_CUR.filter((x) => !excludedCodes.includes(x.COD))
    if (code.COD === 'A') {
      commonSearchApi({
        queryId: 'HLTCB0010_SEARCH_28',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
        },
      }).then((res) => {
        for (let arr of res.ORESULT_CUR) {
          if (arr.CODE === 'A01') {
            imageFlagSetting1(arr)
          } else if (arr.CODE === 'A02') {
            imageFlagSetting2(arr)
          } else if (arr.CODE === 'A03') {
            imageFlagSetting1(arr)
          } else {
            imageFlagSetting1(arr)
          }
        }
        //CODE별로 합침
        const resultMap = _.keyBy(res.ORESULT_CUR, 'CODE')
        perHealthData.value = tempCode.map((item) => ({
          ...item,
          ...(resultMap[item.COD] || {}),
        }))
      })
    } else if (code.COD === 'B') {
      commonSearchApi({
        queryId: 'HLTCB0010_SEARCH_29',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
        },
      }).then((res) => {
        for (let arr of res.ORESULT_CUR) {
          if (arr.CODE === 'B01') {
            imageFlagSetting2(arr)
          } else if (arr.CODE === 'B02') {
            imageFlagSetting2(arr)
          } else if (arr.CODE === 'B03') {
            imageFlagSetting2(arr)
          } else if (arr.CODE === 'B04') {
            imageFlagSetting1(arr)
          } else {
            imageFlagSetting1(arr)
          }
        }
        //CODE별로 합침
        const resultMap = _.keyBy(res.ORESULT_CUR, 'CODE')
        perHealthData.value = tempCode.map((item) => ({
          ...item,
          ...(resultMap[item.COD] || {}),
        }))
      })
    } else if (code.COD === 'C') {
      commonSearchApi({
        queryId: 'HLTCB0010_SEARCH_30',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
        },
      }).then((res) => {
        for (let arr of res.ORESULT_CUR) {
          if (arr.CODE === 'C01') {
            if (arr.LAST_YEAR < arr.THIS_YEAR) {
              arr.image = image8 //악화
            } else if (arr.LAST_YEAR === arr.THIS_YEAR) {
              arr.image = image7 //동일
            } else {
              arr.image = image6 //개선
            }
          } else {
            imageFlagSetting1(arr)
          }
        }
        //CODE별로 합침
        const resultMap = _.keyBy(res.ORESULT_CUR, 'CODE')
        perHealthData.value = tempCode.map((item) => ({
          ...item,
          ...(resultMap[item.COD] || {}),
        }))
      })
    } else if (code.COD === 'D') {
      commonSearchApi({
        queryId: 'HLTCB0010_SEARCH_31',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
        },
      }).then((res) => {
        for (let arr of res.ORESULT_CUR) {
          imageFlagSetting1(arr)
        }
        //CODE별로 합침
        const resultMap = _.keyBy(res.ORESULT_CUR, 'CODE')
        perHealthData.value = tempCode.map((item) => ({
          ...item,
          ...(resultMap[item.COD] || {}),
        }))
      })
    } else {
      commonSearchApi({
        queryId: 'HLTCB0010_SEARCH_32',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
        },
      }).then((res) => {
        for (let arr of res.ORESULT_CUR) {
          imageFlagSetting1(arr)
        }
        //CODE별로 합침
        const resultMap = _.keyBy(res.ORESULT_CUR, 'CODE')
        perHealthData.value = tempCode.map((item) => ({
          ...item,
          ...(resultMap[item.COD] || {}),
        }))
      })
    }
  })
  Promise.all([
    getCodeList(`HHIIOA`),
    getCodeList(`HHIIOB`),
    getCodeList(`HHIIOC`),
    getCodeList(`HHIIOD`),
    getCodeList(`HHIIOE`),
  ]).then((res) => {
    codeList.CONCATED_ARRAY = [
      ...res[0].ORESULT_CUR,
      ...res[1].ORESULT_CUR,
      ...res[2].ORESULT_CUR,
      ...res[3].ORESULT_CUR,
      ...res[4].ORESULT_CUR,
    ]
      .filter((x) => x.COD != 'A06')
      .filter((x) => x.COD != 'A05')
    //안전보건과가 아니면 안보여줌
    if (!checkAuthFlag.GROUP_A) {
      let exceptionCode = ['E05', 'E06', 'E07', 'E08', 'E09', 'E10']
      codeList.CONCATED_ARRAY = codeList.CONCATED_ARRAY.filter((x) => !exceptionCode.includes(x.COD))
      console.log('codeList.CONCATED_ARRAY')
    }
  })
}

const imageFlagSetting1 = (arr) => {
  let differ = arr.LAST_YEAR - arr.THIS_YEAR

  //개선되었을때
  if (differ >= 0.1) {
    arr.image = image6
  }
  //유지일때
  else if (differ == 0) {
    arr.image = image7
  }
  //악화되었을때
  else {
    arr.image = image8
  }

  return arr
}

const imageFlagSetting2 = (arr) => {
  let differ = arr.LAST_YEAR - arr.THIS_YEAR
  //개선되었을때
  if (differ <= -0.1) {
    arr.image = image6
  }
  //유지일때
  else if (differ == 0) {
    arr.image = image7
  }
  //악화되었을때
  else {
    arr.image = image8
  }

  return arr
}

//권한체크하는 함수
const checkAuth = () => {
  //보건관리과 소속 또는 보건지표 모듈 관리자일때
  if (
    (userStore.bsnsCd === 'AN00' && userStore.deptCd === 'N1K0' && userStore.asgnCd === 'N1K2') ||
    userStore.authGrpCd.includes('HLTC001')
  ) {
    checkAuthFlag.GROUP_A = true
  }
  //부서장,직책과장일때
  else if (userStore.offiResCd === '15' || userStore.offiResCd === '16') {
    checkAuthFlag.GROUP_B = true
  }
  //일반직원일때(소속부서만)
  else {
    checkAuthFlag.GROUP_C = true
  }
}

onMounted(async () => {
  checkAuth()
  await initCodeList()
})

const clickListItem = (COD) => {
  ifValue.value = COD
}

const backStatus = () => {
  ifValue.value = 'default'
}

const changePage = (val) => {
  ifValue.value = val
}
</script>

<template>
  <v-card class="pa-0 fill-height" v-if="ifValue == 'default'">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle :title="$t(useLogsStore().menuId)" />
    </v-card-title>
    <v-card-text class="pa-3 pt-3 mx-2 searchArea">
      <div class="d-flex justify-space-evenly">
        <v-sheet id="A" class="mainCard" :class="{ active: activeSheet === 'A' }" @click="setSheet('A')">
          <div class="d-flex justify-space-between" style="margin-top: 35px">
            <div class="mainCardText">건강행태</div>
            <div style="width: 50%">
              <v-img :src="image1" width="90%" height="30%"> </v-img>
            </div>
          </div>
        </v-sheet>
        <v-sheet id="B" class="mainCard" :class="{ active: activeSheet === 'B' }" @click="setSheet('B')">
          <div class="d-flex justify-space-between" style="margin-top: 35px">
            <div style="margin-top: 15px; margin-left: 25px">보건의료서비스</div>
            <div style="width: 50%">
              <v-img :src="image2" width="90%" height="30%"></v-img>
            </div>
          </div>
        </v-sheet>
        <v-sheet id="C" class="mainCard" :class="{ active: activeSheet === 'C' }" @click="setSheet('C')">
          <div class="d-flex justify-space-between" style="margin-top: 35px">
            <span style="margin-top: 15px; position: relative; left: 22px">보건 자원 및 기타</span>
            <span style="width: 50%">
              <v-img :src="image3" width="100%" height="30%"></v-img>
            </span>
          </div>
        </v-sheet>
        <v-sheet id="D" class="mainCard" :class="{ active: activeSheet === 'D' }" @click="setSheet('D')">
          <div class="d-flex justify-space-between" style="margin-top: 35px">
            <div class="mainCardText" style="margin-top: 15px">건강상태</div>
            <div style="width: 50%">
              <v-img :src="image4" width="100%" height="30%"></v-img>
            </div>
          </div>
        </v-sheet>
        <v-sheet id="E" class="mainCard" :class="{ active: activeSheet === 'E' }" @click="setSheet('E')">
          <div class="d-flex justify-space-between" style="margin-top: 35px">
            <div class="mainCardText" style="margin-top: 15px">산업보건</div>
            <div style="width: 50%">
              <v-img :src="image5" width="100%" height="30%"></v-img>
            </div>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
    <div style="margin-top: 30px">
      <span style="margin-left: 3.2%; font-weight: 700; font-size: 20px">{{ clickedSheet }}</span>
      <div style="margin-left: 60px; margin-right: 60px; height: 55vh; overflow-y: auto">
        <v-list width="100%" border-sm>
          <v-row dense style="width: 100%">
            <v-col v-for="(item, index) in perHealthData" :key="index" cols="6" class="mt-4">
              <v-list-item
                :value="item.COD"
                class="w-100 custom-hover listBorder"
                @click="clickListItem(item.COD)"
                style="height: 100px"
              >
                <v-list-item-title
                  v-text="item.TXT"
                  class="mt-2 wrap-text"
                  :style="{
                    width: item.COD === 'B04' || item.COD === 'B05' ? '250px' : '317px',
                    marginTop: '10px',
                    fontSize: '23px',
                    marginBottom: '20px',
                  }"
                >
                </v-list-item-title>
                <template v-slot:append>
                  <div style="margin-top: -2px">
                    <v-img
                      :src="item.image"
                      width="34%"
                      height="30%"
                      class="ml-1"
                      style="position: relative; left: 30%"
                    ></v-img>
                  </div>
                  <div class="d-flex" style="margin-top: 5px">
                    <div class="vListFont mt-2" style="font-weight: 500; margin-right: 20px; white-space: pre-line">
                      {{
                        /*
                        1분기 일때는 전년도 3분기
                        2분기 일때는 전년도 4분기
                        */
                        (item.COD === 'B04' || item.COD === 'B05') && quarter === 1
                          ? `${new Date().getFullYear() - 1}\n3분기`
                          : (item.COD === 'B04' || item.COD === 'B05') && quarter === 2
                          ? `${new Date().getFullYear() - 1}\n4분기`
                          : (item.COD === 'B04' || item.COD === 'B05') && quarter !== 2
                          ? `${new Date().getFullYear()}\n${quarter - 2}분기`
                          : new Date().getFullYear() - 2
                      }}
                    </div>
                    <v-chip
                      color="primary"
                      class="mx-5 d-flex justify-center vListFont"
                      :style="{
                        fontWeight: 400,
                        width: '90px',
                        marginTop: item.COD === 'B04' || item.COD === 'B05' ? '20px' : '8px',
                      }"
                    >
                      {{ item.COD === 'C01' ? Number(item.LAST_YEAR).toLocaleString() : item.LAST_YEAR }}
                      {{
                        item.COD !== 'C01' && item.COD !== 'C02' && item.COD !== 'E03'
                          ? '%'
                          : item.COD === 'C02'
                          ? '세'
                          : item.COD === 'C01'
                          ? ''
                          : item.COD === 'E03'
                          ? '배'
                          : ''
                      }}
                    </v-chip>
                    <v-divider
                      :thickness="2"
                      class="border-opacity-25"
                      color="info"
                      vertical
                      style="margin-right: 15px; height: 70px"
                    ></v-divider>
                    <div class="vListFont mt-2" style="font-weight: 500; margin-right: 20px; white-space: pre-line">
                      {{
                        /*
                        1분기 일때는 전년도 4분기
                        2분기 일때는 올해 1분기
                        */
                        (item.COD === 'B04' || item.COD === 'B05') && quarter === 1
                          ? `${new Date().getFullYear() - 1}\n4분기`
                          : (item.COD === 'B04' || item.COD === 'B05') && quarter === 2
                          ? `${new Date().getFullYear()}\n1분기`
                          : (item.COD === 'B04' || item.COD === 'B05') && quarter !== 2
                          ? `${new Date().getFullYear()}\n${quarter - 1}분기`
                          : new Date().getFullYear() - 1
                      }}
                    </div>
                    <v-chip
                      color="primary"
                      class="mx-5 d-flex justify-center vListFont"
                      :style="{
                        fontWeight: 400,
                        width: '90px',
                        marginTop: item.COD === 'B04' || item.COD === 'B05' ? '20px' : '8px',
                      }"
                    >
                      {{ item.COD === 'C01' ? Number(item.THIS_YEAR).toLocaleString() : item.THIS_YEAR }}
                      {{
                        item.COD !== 'C01' && item.COD !== 'C02' && item.COD !== 'E03'
                          ? '%'
                          : item.COD === 'C02'
                          ? '세'
                          : item.COD === 'C01'
                          ? ''
                          : item.COD === 'E03'
                          ? '배'
                          : ''
                      }}
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </v-col>
          </v-row>
        </v-list>
      </div>
    </div>
  </v-card>
  <!-- 비만율 -->
  <HLTCB0010_01
    v-if="ifValue == 'A01'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_01>
  <!-- 운동실천율 -->
  <HLTCB0010_02
    v-if="ifValue == 'A02'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_02>
  <!-- 음주율 -->
  <HLTCB0010_03
    v-if="ifValue == 'A03'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_03>
  <!-- 현재흡연율 -->
  <HLTCB0010_04
    v-if="ifValue == 'A04'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_04>
  <!-- 고강도 운동 실천율 -->
  <HLTCB0010_05
    v-if="ifValue == 'A05'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_05>
  <!-- 고위험 음주율-->
  <HLTCB0010_06
    v-if="ifValue == 'A06'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_06>
  <!-- 건강진단실시율-->
  <HLTCB0010_07
    v-if="ifValue == 'B01'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_07>
  <!-- 사후관리실시율 -->
  <HLTCB0010_08
    v-if="ifValue == 'B02'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_08>
  <!-- 직원당 의료시설 이용횟수 -->
  <HLTCB0010_09
    v-if="ifValue == 'B03'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_09>
  <!-- 협력사 건강관리위험대상자 비율 -->
  <HLTCB0010_10
    v-if="ifValue == 'B04'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_10>
  <!-- 협력사 건강관리위험대상자 개선 비율 -->
  <HLTCB0010_11
    v-if="ifValue == 'B05'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_11>
  <!-- 직원당 보호구 및 안전소모품 비용 -->
  <HLTCB0010_12
    v-if="ifValue == 'C01'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_12>
  <!-- 연령대별 직원 비율 -->
  <HLTCB0010_13
    v-if="ifValue == 'C02'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_13>
  <!-- 고혈압질환자 비율 -->
  <HLTCB0010_14
    v-if="ifValue == 'D01'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_14>
  <!-- 고혈압전단계 비율 -->
  <HLTCB0010_15
    v-if="ifValue == 'D02'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_15>
  <!-- 당뇨질환자 비율 -->
  <HLTCB0010_16
    v-if="ifValue == 'D03'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_16>
  <!-- 뇌심혈관계질환 고위험군 비율 -->
  <HLTCB0010_17
    v-if="ifValue == 'D04'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_17>
  <!-- 작업환경측정 초과율 -->
  <HLTCB0010_18
    v-if="ifValue == 'E01'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_18>
  <!-- 유해인자별 작업환경측정 초과율 -->
  <HLTCB0010_19
    v-if="ifValue == 'E02'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_19>
  <!-- 작업환경측정 노출기준 초과배수 -->
  <HLTCB0010_20
    v-if="ifValue == 'E03'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_20>
  <!-- 유해인자별 작업환경측정 노출기준 초과배수 -->
  <HLTCB0010_21
    v-if="ifValue == 'E04'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_21>
  <!-- 직업병 요관찰율 -->
  <HLTCB0010_22
    v-if="ifValue == 'E05'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_22>
  <!-- 질환계통별 직업병 요관찰율 -->
  <HLTCB0010_23
    v-if="ifValue == 'E06'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_23>
  <!-- 직업병 유소견율 -->
  <HLTCB0010_24
    v-if="ifValue == 'E07'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_24>
  <!-- 질환계통별 직업병 유소견율 -->
  <HLTCB0010_25
    v-if="ifValue == 'E08'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_25>
  <!-- 업무상 질병 발생율 -->
  <HLTCB0010_26
    v-if="ifValue == 'E09'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_26>
  <!-- 질환계통별 업무상 질병 발생율 -->
  <HLTCB0010_27
    v-if="ifValue == 'E10'"
    @back="backStatus"
    @changePage="changePage"
    :code-array1="codeList.CODE_LIST"
    :code-array2="codeList.CONCATED_ARRAY"
  ></HLTCB0010_27>
</template>

<style scoped lang="scss">
.mainCard {
  height: 12vh;
  width: 18%;
  font-size: 22px;
  text-align: center;
  justify-content: center;
  background-color: white;
  font-weight: 650;
}

.vListFont {
  font-size: 23px;
  margin-bottom: 20px;
}
//리스트 호버 했을때 색상
.custom-hover:hover {
  background-color: #e6f0ff !important;
}

.listBorder {
  border: 1px solid #e4e4e4; /* 굵기 + 선 스타일 + 색상 */
}

.mainCardText {
  margin-left: 35px;
  margin-top: 15px;
}

.wrap-text {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  word-break: break-word !important;
}
</style>
