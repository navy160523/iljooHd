<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonRequest2, commonRequest3 } from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { useRoute , useRouter } from "vue-router"

defineOptions({
  name: "SRMAA0020",
})

const route = useRoute()
const router = useRouter()

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const t = useI18n().t //다국어
const userStore = useUserStore()
const carousel = ref(0)
const carouselIdx = ref(0)
const safeResultIdx = ref(0)

// 팝업
const deptPopup = ref(null)

// 이미지URL
const imageSrc = ref(null)
const dummy = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  STR_DT: dayjs().format("YYYY-01-01"),
  END_DT: dayjs().format("YYYY-MM-DD")
})

// 출력 데이터
const resultData = reactive({
  TOTAL: [],
  RSK: [],
  HISAFE: [],
  GRADE: [],
  IMP_COMPLETE: {}, // 부서 개선완료 사례
})

// 안전개선 미검토 / 개선지연 항목 그리드 세팅
const grdMain = ref(null)

const grdProps1 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
    rowIndicator: { visible: false },
    // header: { visible: false },
  }, 
  fields: [
    { fieldName: "GUBUN", dataType: "text",  width: '50', header: { text: t("항목") } },
    { fieldName: "REG_DT", dataType: "text",  width: '50', header: { text: t("접수일") }, 
      renderer: {
        type:"html",
        callback: function (grid, model, width, height) {
          let daysDifference = ''

          if (dayjs(model.value).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) {
            // 두 날짜 간의 차이 계산 (일 단위)
            daysDifference = '(+' + dayjs().diff(dayjs(model.value), 'day') + ' Days)'
          } else if (dayjs(model.value).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
            daysDifference = '(D-Day)'
          } else {
            daysDifference = ''
          }

          return "<span>"+ dayjs(model.value).format('YYYY-MM-DD') + "</span>" + "<span style='color: red;'>" + daysDifference + "</span>"
        }
      }
    },
    { fieldName: "RISK_NM", dataType: "text", header: { text: t("제목") }, styleName: "left-column" },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'RISK_REVIEW_RESULT', dataType: 'text', visible: false },
    { fieldName: 'TASK_SEQ', dataType: 'text', visible: false },
  ],
  columns: [],
})
grdProps1.columns = grdProps1.fields

// 안전개선 미검토 / 개선지연 항목 그리드 세팅
const grdSub = ref(null)

const grdProps2 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
    rowIndicator: { visible: false },
  },
  fields: [
    { 
      fieldName: "TUMBNAIL",
      width: '220',
      header: { text: t("썸네일") },
      renderer: {
        width: "260",
        type: "image",
        imageField: "TUMBNAIL",
        imageHeight: 130,
      }
    },
    { fieldName: "REG_DT", dataType: "text", header: { text: t("접수일") },
      renderer: {
        type:"html",
        callback: function (grid, model, width, height) {
          let daysDifference = ''

          if (dayjs(model.value).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) {
            // 두 날짜 간의 차이 계산 (일 단위)
            daysDifference = '(+' + dayjs().diff(dayjs(model.value), 'day') + ' Days)'
          } else if (dayjs(model.value).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
            daysDifference = '(D-Day)'
          } else {
            daysDifference = ''
          }

          return "<span>"+ dayjs(model.value).format('YYYY-MM-DD') + "</span>" + "<span style='color: red;'>" + daysDifference + "</span>"
        }
      }
    },
    { fieldName: "RISK_NM", dataType: "text", header: { text: t("제목") }, styleName: "left-column" },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'THUMBNAIL_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'TASK_SEQ', dataType: 'text', visible: false }
  ],
  columns: [],
})
grdProps2.columns = grdProps2.fields

// Chart Setting
const pieChart = ref({
  option: {
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: "2%",
      left: "right",
      align: "right",
      padding: [5, 10],
      textStyle: {
        color: "#666666",
        fontFamily: "pretendard",
        fontSize: 15,
        padding: [0, 2, 0, 0],
      },
      icon: "rect",
      itemGap: 20,
      itemWidth: 14,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        top: "10%",
        startAngle: 0,
        label: {
          show: true,
          position: "inner",
          formatter: (value, param) => {
            let result = ``

            if (value.data.name ==='개선검토') {
              result = `${resultData.TOTAL.IMP_REVIEW_CNT}건, ${value.value}%`
            } else if (value.data.name ==='개선중') {
              result = `${resultData.TOTAL.BEING_IMP_CNT}건, ${value.value}%`
            } if (value.data.name ==='개선완료') {
              result = `${resultData.TOTAL.IMP_COMPLETE_CNT}건, ${value.value}%`
            }

            return result
          },
        },
        labelLine: {
          show: true,
        },
        data: [
          { value: 0, name: "개선검토", itemStyle: { color: "#0D47A1" } },
          { value: 0, name: "개선중", itemStyle: { color: "#1976D2" } },
          { value: 0, name: "개선완료", itemStyle: { color: "#4527A0" } },
        ],
      },
    ],
  },
})

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    searchData()
  }
}

// 안전 리스크 개선 현황 조회
const searchSrmImp = async () => {
  const data = { 
    queryId: "SRMAA0020_SEARCH_01", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    resultData.TOTAL = res.ORESULT_CUR1[0]
    resultData.RSK = res.ORESULT_CUR2[0]
    resultData.HISAFE = res.ORESULT_CUR3[0]

    pieChart.value.option.series[0].data[0].value = res.ORESULT_CUR1[0].IMP_REVIEW_PERCENT
    pieChart.value.option.series[0].data[1].value = res.ORESULT_CUR1[0].BEING_IMP_PERCENT
    pieChart.value.option.series[0].data[2].value = res.ORESULT_CUR1[0].IMP_COMPLETE_PERCENT
  })
}

// 위험등급 카운트
const searchGrade = async () => {
  resultData.GRADE = []

  const data = { 
    queryId: "SRMAA0020_SEARCH_02", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    resultData.GRADE = res.ORESULT_CUR
  })
}

// 안전개선 미검토/개선지연 항목
const searchDelay = async () => {
  const data = { 
    queryId: "SRMAA0020_SEARCH_03", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().sortingOptions.enabled = false
  })
}

// 부서 개선완료 사례
const searchImpComplete = async () => {
  const data = { 
    queryId: "SRMAA0020_SEARCH_04", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    let currentIndex = 0  // 최초

    if (!res.ORESULT_CUR || res.ORESULT_CUR.length === 0) {
      return
    }

    const updateData = (idx) => {
      if (idx >= res.ORESULT_CUR.length) {
        return
      }

      let fileInfo = {
        CMPNY_DIV: res.ORESULT_CUR[idx].CMPNY_DIV,
        FILE_ID: res.ORESULT_CUR[idx].THUMBNAIL_FILE_ID
      }

      fileSearch([fileInfo])

      resultData.IMP_COMPLETE.RISK_NM = res.ORESULT_CUR[idx].RISK_NM
    }

    updateData(currentIndex)

    // 5초마다 인덱스를 1씩 증가시키면서 데이터를 업데이트
    setInterval(() => {
      currentIndex++
      if (currentIndex >= res.ORESULT_CUR.length) {
        currentIndex = 0
      }
      updateData(currentIndex)
    }, 5000)
  })
}

// 파일 조회 및 다운로드
const fileSearch = (val) => {
  val.forEach(el => {
    const data = {
      queryId: "searchFile",
      param: {
        CMPNY_DIV: el.CMPNY_DIV,
        FILE_ID: el.FILE_ID
      }
    }

    const meta = {
      useProgress: false
    }

    return commonRequest3("/hse/common/selectList", data, meta).then(async res => {
      let type = res.ORESULT_CUR[0].FILE_TYPE.toUpperCase()

      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        fileDownLoad(res.ORESULT_CUR[0])
      }
    })
  })
}

// 이미지 다운로드
const fileDownLoad = val => {
  let contentDisposition = null
  let fileName = null
  let blob = null
  let imageURL = null
  let img = new Image() // 이미지 요소 생성

  commonRequest2('/hse/file/downloadFiles', val).then(res => {
    contentDisposition = res.contentDisposition
    fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

    blob = new Blob([res])
    imageURL = URL.createObjectURL(blob)

    img = new Image() // 이미지 요소 생성

    img.src = imageURL // 이미지 URL 설정
    img.alt = fileName

    imageSrc.value = URL.createObjectURL(blob)  // 이미지 출력
  })
}

// 신규 안전 개선 접수 현황
const searchNewImp = async () => {
  const data = { 
    queryId: "SRMAA0020_SEARCH_05", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  const res = await commonRequest3("/hse/common/selectList", data, meta)
  let fileInfo = []

  for (const item of res.ORESULT_CUR) {
    const fileData = {
      queryId: "searchFile",
      param: {
        CMPNY_DIV: item.CMPNY_DIV,
        FILE_ID: item.THUMBNAIL_FILE_ID
      }
    }

    const fileMeta = {
      useProgress: false
    }

    const fileRes = await commonRequest3("/hse/common/selectList", fileData, fileMeta)
    fileInfo.push(fileRes.ORESULT_CUR[0])
  }

  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getGridView().sortingOptions.enabled = false
  outThumbnail(fileInfo) 
}



// 썸네일
const outThumbnail = async val => {
  val.forEach((item, index) => {
    commonRequest2('/hse/file/downloadFiles', item).then(res => {
      const contentDisposition = res.contentDisposition
      const fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

      const blob = new Blob([res])
      const imageURL = URL.createObjectURL(blob)

      const img = new Image() // 이미지 요소 생성

      img.src = imageURL // 이미지 URL 설정
      img.alt = fileName
      dummy.value = imageURL

      grdSub.value.getDataProvider().setValue(index, "TUMBNAIL", dummy.value)
    })
  }) 
}

// 부서 선택 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({ ASGN_NM: searchParams.DEPT_NM })
}
// 부서 선택 이벤트
const onDeptSelected = val => { 
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
}

// 안전개선 미검토/개선지연 항목 그리드 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  const rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  router.push({
    path: '/40_safety-risk/SRM_A/SRMAA0030', 
    state: { data: rowData }
  })
}

// 안전개선 미검토/개선지연 항목 그리드 더블클릭 이벤트
const onCellDblClicked2 = (grid, clickData) => {
  const rowData = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)

  router.push({
    path: '/40_safety-risk/SRM_A/SRMAA0030', 
    state: { data: rowData }
  })
}

// 조회
const searchData = async() => {
  await searchSrmImp()
  await searchGrade()
  await searchDelay()
  await searchImpComplete()
  await searchNewImp()
}

onMounted(() => {
  searchData()
})
</script>

<template>
  <v-card class="pa-3 fill-height SRMAA0020_dashboard">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="px-2 py-0 content-area p-relative">
      <div class="d-flex flex-column fill-height">
        <div class="d-flex searchArea mb-0">
          <i-input
            v-model="searchParams.STR_DT"
            width="200px" 
            :label="$t('조회기간')" 
            type="date" 
            margin="30px" 
          />
          <i-input 
            v-model="searchParams.END_DT"
            label-width="30px"
            width="200px" 
            :label="$t('~')" 
            type="date"
          />
          <i-input
            v-model="searchParams.DEPT_NM"
            width="300px"
            :label="$t('부서')"
            placeholder="내용을 입력해주세요."
            append-inner-icon="mdi-magnify"
            @click:appendInner="openDeptPopup()"
            @keydown.enter="e => { openDeptPopup() }"
          />
        </div>
        <div class="mt-3 d-flex fill-height">
          <v-sheet width="60%" height="100%">
            <IGridTitle
              :title="$t('안전 리스크 개선 현황')"
            >
              <template #editors />
            </IGridTitle>
            <div class="d-flex">
              <v-sheet width="60%">
                <div>
                  <v-sheet class="d-flex" color="#F4F5F9">
                    <v-sheet class="pa-2 align-center" width="40%" border="grey-lighten-2 sm">
                      <span class="text-h6">총 건수</span>
                    </v-sheet>
                    <v-sheet class="pa-2 align-center" width="20%" border="grey-lighten-2 sm">
                      <span class="text-h6">개선검토</span>
                    </v-sheet>
                    <v-sheet class="pa-2 align-center" width="20%" border="grey-lighten-2 sm">
                      <span class="text-h6">개선중</span>
                    </v-sheet>
                    <v-sheet class="pa-2 align-center" width="20%" border="grey-lighten-2 sm">
                      <span class="text-h6">개선완료</span>
                    </v-sheet>
                  </v-sheet>
                  <v-sheet class="d-flex" color="#F4F5F9">
                    <v-sheet class="pa-2 justify-center align-center" width="40%" border="grey-lighten-2 sm">
                      <span class="text-subtitle-1 text-center">{{ resultData.TOTAL.TOTAL_CNT }}건</span>
                    </v-sheet>
                    <v-sheet class="pa-2 align-center" width="20%" border="grey-lighten-2 sm">
                      <span class="text-subtitle-1 text-center">
                        {{ resultData.TOTAL.IMP_REVIEW_CNT }}건<br/>({{ resultData.TOTAL.IMP_REVIEW_PERCENT }}%)
                      </span>
                    </v-sheet>
                    <v-sheet class="pa-2 align-center" width="20%" border="grey-lighten-2 sm">
                      <span class="text-subtitle-1 text-center">
                        {{ resultData.TOTAL.BEING_IMP_CNT }}건<br/>({{ resultData.TOTAL.BEING_IMP_PERCENT }}%)
                      </span>
                    </v-sheet>
                    <v-sheet class="pa-2 align-center" width="20%" border="grey-lighten-2 sm">
                      <span class="text-subtitle-1 text-center">
                        {{ resultData.TOTAL.IMP_COMPLETE_CNT }}건<br/>({{ resultData.TOTAL.IMP_COMPLETE_PERCENT }}%)
                      </span>
                    </v-sheet>
                  </v-sheet>
                </div>
                <div class="d-flex">
                  <v-sheet class="pa-1 align-center border-sm" width="30%">
                    <span class="text-subtitle-1 text-center">
                      안전리스크 접수<br/>(상시/공모전)
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="10%">
                    <span class="text-subtitle-1">
                      {{ resultData.RSK.RSK_TOTAL_CNT }}건
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="20%">
                    <span class="text-subtitle-1">
                      {{ resultData.RSK.RSK_IMP_REVIEW_CNT }}건
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="20%">
                    <span class="text-subtitle-1">
                      {{ resultData.RSK.RSK_BEING_IMP_CNT }}건
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="20%">
                    <span class="text-subtitle-1">
                      {{ resultData.RSK.RSK_IMP_COMPLETE_CNT }}건
                    </span>
                  </v-sheet>
                </div>
                <div class="d-flex">
                  <v-sheet class="pa-1 align-center border-sm" width="30%">
                    <span class="text-subtitle-1 text-center">
                      Hi-SAFE
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="10%">
                    <span class="text-subtitle-1">
                      {{ resultData.HISAFE.HI_TOTAL_CNT }}건
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="20%">
                    <span class="text-subtitle-1">
                      {{ resultData.HISAFE.HI_IMP_REVIEW_CNT }}건
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="20%">
                    <span class="text-subtitle-1">
                      {{ resultData.HISAFE.HI_BEING_IMP_CNT }}건
                    </span>
                  </v-sheet>
                  <v-sheet class="pa-1 align-center justify-center border-sm" width="20%">
                    <span class="text-subtitle-1">
                      {{ resultData.HISAFE.HI_IMP_COMPLETE_CNT }}건
                    </span>
                  </v-sheet> 
                </div>
                <div class="d-flex mt-3 searchArea">
                  <v-sheet class="d-flex justify-center" width="33%">
                    <v-sheet class="justify-center pa-2">
                      <p>고위험</p>
                    </v-sheet>
                    <v-sheet class="pa-2">
                      <p><span class="text-h6">{{ resultData.GRADE[0] ? resultData.GRADE[0].COUNT : '' }}</span>건</p>
                    </v-sheet>
                  </v-sheet>
                  <v-sheet class="d-flex justify-center" width="34%">
                    <v-sheet class="justify-center pa-2">
                      <p>중위험</p> 
                    </v-sheet>
                    <v-sheet class="pa-2">
                      <p><span class="text-h6">{{ resultData.GRADE[1] ? resultData.GRADE[1].COUNT : '' }}</span>건</p>
                    </v-sheet>
                  </v-sheet>
                  <v-sheet class="d-flex justify-center" width="33%">
                    <v-sheet class="justify-center pa-2">
                      <p>약위험</p>
                    </v-sheet>
                    <v-sheet class="pa-2">
                      <p><span class="text-h6">{{ resultData.GRADE[2] ? resultData.GRADE[2].COUNT : '' }}</span>건</p>
                    </v-sheet>
                  </v-sheet>
                </div>
              </v-sheet>
              <v-sheet class="ml-2 border-sm" width="40%">
                <e-chart :option="pieChart.option"/>
              </v-sheet>
            </div>
            <div class="mt-3">
            <IGridTitle
              :title="$t('안전개선 미검토/개선지연 항목')"
            >
              <template #editors />
            </IGridTitle>
            </div>
            <div class="h-auto">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys" 
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
                @onCellDblClicked="onCellDblClicked"
              />
            </div>
          </v-sheet>
          <v-sheet class="ml-3" width="40%" height="100%">
            <IGridTitle
              :title="$t('부서 개선완료 사례')"
            >
              <template #editors />
            </IGridTitle>
            <div class="h-auto">
              <div class="border-sm">
                <v-sheet>
                  <v-img
                    :src="imageSrc"
                    width="400"
                    height="270"
                    class="align-self-center"
                    aspect-ratio 
                  />
                </v-sheet>
                <v-sheet class="pa-3"> 
                  <span class="text-subtitle-1 text-blue-darken-4">
                    {{ resultData.IMP_COMPLETE.RISK_NM ? resultData.IMP_COMPLETE.RISK_NM : 'No Data'}}
                  </span>
                </v-sheet>
              </div>
              <div class="mt-3">
                <IGridTitle
                  :title="$t('신규 안전 개선 접수 현황')"
                >
                  <template #editors />
                </IGridTitle>
              </div> 
              <div class="h-auto">
                <RealGrid
                  ref="grdSub"
                  :grid-view-option="grdProps2.gridViewOption"
                  :keys="grdProps2.keys" 
                  :fields="grdProps2.fields"
                  :columns="grdProps2.columns"
                  :column-layout="grdProps2.columnLayout"
                  @onCellDblClicked="onCellDblClicked2"
                />
              </div>
            </div>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- 부서 선택 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 185px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>