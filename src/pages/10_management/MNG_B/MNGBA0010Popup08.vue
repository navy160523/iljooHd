<!-- 
  화면명   : 리스크 통합관리 현황
  화면개요 : 안전리스크 제보 조회 및 신규 등록/ Hi-SAFE, SOM 관리
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { useRouter } from 'vue-router'
import { useRoute } from "vue-router";
import { useCommonStore } from "@hiway/stores/common";
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

// 작업표준 신규제정 팝업 호출
const props = defineProps({
  dialog: 'N',
  val1: '',
  half: ''
})

const emit = defineEmits(['close'])

const router = useRouter()            // 라우터
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const userLogStore = useLogsStore()
const t = useI18n().t                 //다국어
const route = useRoute()
const commonStore = useCommonStore()
const menuTitle = ref(null)
const grdMain = ref(null)

// 권한 (GRP00291: 안전 관리자 그룹)
const isAdmin = ref(userStore.authGrpCd.includes('GRP00291') ? true : false)

// 팝업
const sRMAA0030Popup01 = ref(null)
const hiSafePopup = ref(null)
const somPopup = ref(null)
/* ***** 안전리스크 제보/관리 ***** */
const dialog = ref(false)

// 이미지 관련
const dummy = ref('')
let cnt = 0

//조회조건
let searchParams = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  PART_CD: '',
  IMP_RESULT: '',
  RISK_REVIEW_RESULT: '',
  LINK: '',
  STR_DT: dayjs().format("YYYY-01-01"),
  END_DT: dayjs().format("YYYY-MM-DD"),
  RISK_NM: '',
  USER_ID: userStore.userId,
  WORK_STANDARD_ID: '',
  SEARCH_TYPE: 'A',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],          // 회사
  BSNS_CD: [],            // 사업부
  DEPT_CD: [],            // 부서
  LINK: [],               // 출처
  IMP_RESULT: [],    // 진행현황
  PART_CD: [],            // 부문
  RISK_REVIEW_RESULT: [], // 진행상태
  SEARCH_TYPE: [
    { COD: 'A', TXT: '제목+내용' },
    { COD: 'B', TXT: '제목' },
    { COD: 'C', TXT: '내용' },
  ]
  // TODO : 2024.05.20 이형운 책임 요청으로 셀 삭제 (추후 필요할 수도 있어서 주석 처리)
  // SOM_STATUS: [],         // S.O.M 진행상태 
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      },
    }),
    getCodeList("HHIJJC12", userStore.cmpnyDiv, 'Y'), // 출처[2] (공통코드, 회사코드, useYn:'Y')
    getCodeList("HHIJJE07"), // 진행현황[3]
    getCodeList('HHIJJE08'), // 진행상태[4]
    getCodeList('HHIJJE09'), // S.O.M 진행상태[5]
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.LINK = res[2].ORESULT_CUR
    
    // TODO : 2024.06.25 이형운 책임 요청으로 조회조건(개선결과, 진행상태) 병합
    // codeList.IMP_RESULT = res[3].ORESULT_CUR
    // codeList.RISK_REVIEW_RESULT = res[4].ORESULT_CUR

    const changeCod = res[3].ORESULT_CUR.map((item, index) => {
      return { ...item, COD: ['I', 'J', 'K'][index] }
    })

    codeList.RISK_REVIEW_RESULT = [...res[4].ORESULT_CUR, ...changeCod]

    // TODO : 2024.05.20 이형운 책임 요청으로 셀 삭제 (추후 필요할 수도 있어서 주석 처리)
    // codeList.SOM_STATUS = res[5].ORESULT_CUR
    
    
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
    codeList.LINK.unshift({ COD: '', TXT: '전체' })
    codeList.IMP_RESULT.unshift({ COD: '', TXT: '전체' })
    codeList.RISK_REVIEW_RESULT.unshift({ COD: '', TXT: '전체' })

    grdMain.value.setBindingColumn("RISK_REVIEW_RESULT", codeList.RISK_REVIEW_RESULT, "COD", "TXT") // 진행상태(리스크 검토현황)

    // TODO : 2024.05.20 이형운 책임 요청으로 셀 삭제 (추후 필요할 수도 있어서 주석 처리)
    // grdMain.value.setBindingColumn("SOM_STATUS", codeList.SOM_STATUS, "COD", "TXT") // S.O.M 진행상태
    
    searchParams.BSNS_CD = props.dialog == 'Y' ? props.val1.BSNS_CD_ORIGIN : userStore.bsnsCd
    
  })
  codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
  codeList.PART_CD.unshift({ PART_NM:"전체", PART_CD:"" })
}

//그리드 속성셋팅
const grdProps1 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: isAdmin.value ? true : false },
  }, 
  fields: [
    { fieldName: "TASK_SEQ", dataType: "text", width: '90', header: { text: t("통합관리번호") } },
    { fieldName: "REG_DT",   dataType: "text", width: '100', header: { text: t("등록일자") } },
    { fieldName: "RISK_NM",  dataType: "text", width: '290', header: { text: t("제목") }, styleName: "left-column rg_blue",
      styleCallback: function(grid, dataCell) {
        // 셀 데이터 조회
        const data = grdMain.value.getDataProvider().getJsonRow(dataCell.index._itemIndex)
        
        // 아이콘 세팅
        let ret = {}
        ret.renderer = {
          type: 'icon',
          iconLocation: 'left',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/images/icons/new-box.png', import.meta.url).href
          },
          iconHeight: 20,
          iconWidth: 20
        }
        
        // 등록일자로부터 7일까지는 아이콘 출력
        if (dayjs().diff(dayjs(data.REG_DT), 'day') < 7) {
          if (data.READERS) {
            if (data.READERS.includes(userStore.userId) === false) {
              return ret 
            }
          } else {
            return ret
          }
        }
      }
    },
    // { 
    //   fieldName: "TUMBNAIL",
    //   width: '220',
    //   header: { text: t("썸네일") },
    //   renderer: {
    //     width: "260",
    //     type: "image",
    //     imageField: "TUMBNAIL",
    //     imageHeight: 130,
    //   }
    // },
    { fieldName: "DEPT_NM",             dataType: "text", width: '160', header: { text: t("담당부서") } },
    { fieldName: "RISK_REVIEW_RESULT",  dataType: "text", width: '160', header: { text: t("진행상태") }, lookupDisplay: true },
    { fieldName: "IMP_FI_DT",           dataType: "text", width: '130', header: { text: t("개선기간") }, styleName: "multiline-editor",
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

          return "<span>~ "+ dayjs(model.value).format('YYYY-MM-DD') + "</span><br/>" + "<span style='color: red;'>" + daysDifference + "</span>"
        }
      }
    },
    { fieldName: "TASK_NO_1",    dataType: "text", width: '95', header: { text: t("Hi-SAFE") },       styleName: "rg_blue" },
    { fieldName: "TASK_NO_4",    dataType: "text", width: '95', header: { text: t("S.O.M") },         styleName: "rg_blue" },

    // TODO : 2024.05.20 이형운 책임 요청으로 셀 삭제 (추후 필요할 수도 있어서 주석 처리)
    // { fieldName: "SOM_STATUS",   dataType: "text", width: '95', header: { text: t("S.O.M 진행상태") }, styleName: "rg_blue", lookupDisplay: true },
    
    // 관리자만 조회 가능
    { fieldName: "TASK_NO_2",    dataType: "text", width: '95', header: { text: t("안전긴급예산") }, styleName: "rg_blue", visible: isAdmin.value ? true : false },
    { fieldName: "TASK_NO_3",    dataType: "text", width: '95', header: { text: t("리스크공모전") }, styleName: "rg_blue", visible: isAdmin.value ? true : false },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV',        dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD',          dataType: 'text', visible: false },
    { fieldName: 'CHECK_ACC',        dataType: 'text', visible: false },
    { fieldName: 'CHECK_ACC_NM',     dataType: 'text', visible: false },
    { fieldName: 'CUR_PROB',         dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD',          dataType: 'text', visible: false },
    { fieldName: 'EMP_NM',           dataType: 'text', visible: false },
    { fieldName: 'EMP_NO',           dataType: 'text', visible: false },
    { fieldName: 'GRADE',            dataType: 'text', visible: false },
    { fieldName: 'GRADE_NM',         dataType: 'text', visible: false },
    { fieldName: 'IMP_DIRECTION',    dataType: 'text', visible: false },
    { fieldName: 'IMP_DIRECTION_NM', dataType: 'text', visible: false },
    { fieldName: 'LINK1',            dataType: 'text', visible: false },
    { fieldName: 'LINK2',            dataType: 'text', visible: false },
    { fieldName: 'LINK3',            dataType: 'text', visible: false },
    { fieldName: 'LINK4',            dataType: 'text', visible: false },
    { fieldName: 'LINK5',            dataType: 'text', visible: false },
    { fieldName: 'MIT_ACTION',       dataType: 'text', visible: false },
    { fieldName: 'NUM',              dataType: 'text', visible: false },
    { fieldName: 'NUM_CNT',          dataType: 'text', visible: false },
    { fieldName: 'PART_CD',          dataType: 'text', visible: false },
    { fieldName: 'PLACE',            dataType: 'text', visible: false },
    { fieldName: 'PROG_ACTION',      dataType: 'text', visible: false },
    { fieldName: 'REMARK',           dataType: 'text', visible: false },
    { fieldName: 'RISK_TYPE',        dataType: 'text', visible: false },
    { fieldName: 'RISK_TYPE_NM',     dataType: 'text', visible: false },
    { fieldName: 'SRM_USER_ID',      dataType: 'text', visible: false },
    { fieldName: 'SRM_USER_NM',      dataType: 'text', visible: false },
    { fieldName: 'TASK_NO_REG',      dataType: 'text', visible: false },
    { fieldName: 'FILE_ID_1',        dataType: 'text', visible: false },
    { fieldName: 'FILE_ID_2',        dataType: 'text', visible: false },
    { fieldName: 'FILE_ID_3',        dataType: 'text', visible: false },
    { fieldName: 'FILE_ID_4',        dataType: 'text', visible: false },
    { fieldName: 'TEMP_YN',          dataType: 'text', visible: false },
    { fieldName: 'READERS',          dataType: 'text', visible: false },
    { fieldName: 'CHK_BUDGET',       dataType: 'text', visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      // .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnClose') {
    onClose()
  } else if (btn.id === 'btnExcel') {
    let excelFileNM = searchParams.STR_DT + '~' + searchParams.END_DT + ' 리스크 통합관리 현황'
    
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({ 
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      allColumns: false,
      lookupDisplay: true,
      exportTemplate: true
    })
  } 
}

const searchData = () => {
  return commonSearchApi({ 
    queryId : 'SRMAA0030_SEARCH_01',
    param: searchParams
  }) 
} 

const afterSearch = async(res) => {
  let searchParams = {}
  let fileInfo = []

  for (let i of res.ORESULT_CUR) {
    // param 정의
    searchParams.CMPNY_DIV = i.CMPNY_DIV
    searchParams.FILE_ID = i.THUMBNAIL_FILE_ID ? i.THUMBNAIL_FILE_ID : i.FILE_ID_1

    await commonSearchApi({ 
      queryId: "searchFile", 
      param: searchParams 
    }).then(res => {
      fileInfo.push(res.ORESULT_CUR[0])
    })
  }

  //outThumbnail(fileInfo)

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 썸네일 이미지 출력
const outThumbnail = async(val) => {
  for (let [index, item] of val.entries()) {
    await commonDownloadFilesApi(item).then(res => {
      const contentDisposition = res.contentDisposition
      const fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

      const blob = new Blob([res])
      const imageURL = URL.createObjectURL(blob)

      const img = new Image() // 이미지 요소 생성

      img.src = imageURL // 이미지 URL 설정
      img.alt = fileName
      dummy.value = imageURL

      grdMain.value.getDataProvider().setValue(index, "TUMBNAIL", dummy.value)
    }).catch(err => {
      console.log(err)
    })
  }
}

// 사업부 변경 시 부문, 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  Promise.all([
    // 부서[0]
    commonSearchApi({
      queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV:'Y'
      }
    }),
    // 부문[1]
    commonSearchApi({
      queryId : 'SEARCH_PART',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        DEPT_CD: '',
      }
    })
  ]).then(res => {
    codeList.DEPT_CD = res[0].ORESULT_CUR // 부서
    codeList.PART_CD = res[1].ORESULT_CUR // 부문

    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
    codeList.PART_CD.unshift({ PART_NM: "전체", PART_CD: "" })

    if (newValue !== oldValue) {

      searchParams.DEPT_CD = ''
      searchParams.PART_CD = ''

      // 작업표준 신규제정에서 팝업으로 호출시 부서코드 한번만 넣어주기
      if(cnt == 0) {
        searchParams.DEPT_CD = props.val1.DEPT_CD
        cnt++
      }
    }
  })
})

// 부문 변경 시 부문에 소속된 부서 조회
watch(() => searchParams.PART_CD, (newValue, oldValue) => {
  codeList.DEPT_CD = []

  commonSearchApi({
    queryId : 'searchASGN50',
    param : {
      CMPNY_DIV: userStore.cmpnyDiv,
			BSNS_CD: searchParams.BSNS_CD,
			PART_CD: newValue,
			REL_CD: '',
			USE_DIV: 'Y',
    }
  }).then(res => {
    res.ORESULT_CUR.map(el => {
      let newArr = {}

      newArr.DEPT_CD = el.ASGN_CD
      newArr.DEPT_NM = el.ASGN_SHRT_NM

      codeList.DEPT_CD.push(newArr)
    })

    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
  })
})

router.afterEach((to, from, next) => {
  if(from.path === '/40_safety-risk/SRM_A/SRMAA0030Popup01'){
    commonStore.loading = false
  }
})
//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  initCodeList()
  //팝업 오픈
  dialog.value = true 
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'전사 RISK 공모전 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('전사 RISK 공모전')"
          :button-list="['btnSearch', 'btnExcel','btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParams.STR_DT"
                label-width="50px" 
                width="300px" 
                :label="$t('등록기간')" 
                type="date" 
                margin="40px"
              />
              <i-input 
                v-model="searchParams.END_DT"
                label-width="30px"
                width="280px" 
                :label="$t('~')" 
                type="date"
              />
              <!-- 회사 -->
              <!-- <i-select
                :label="$t('회사')"
                label-width="50px"
                width="300px"
                v-model="searchParams.CMPNY_DIV"
                :items="codeList.CMPNY_DIV"
                item-value="COD" 
                item-title="TXT"
                readonly 
              /> -->
              <i-select
                :label="$t('사업부')"
                label-width="50px"
                width="300px" 
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <i-select
                v-model="searchParams.PART_CD"
                :label="$t('부문')"
                label-width="50px"
                width="300px"
                :items="codeList.PART_CD"
                item-value="PART_CD"
                item-title="PART_NM"
              />
              <i-select
                :label="$t('부서')"
                label-width="50px"
                width="300px"
                v-model="searchParams.DEPT_CD"
                :items="codeList.DEPT_CD"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
              />
            </div>
            <div class="d-flex mt-2">
              <i-select
                :label="$t('진행상태')"
                label-width="50px"
                width="300px"
                v-model="searchParams.RISK_REVIEW_RESULT"
                :items="codeList.RISK_REVIEW_RESULT"
                item-value="COD"
                item-title="TXT"
              />
              <!-- TODO: 개선 결과 주석 처리 - 이형운 책임 요청(2024.06.25) -->
              <!-- <i-select
                :label="$t('개선결과')"
                label-width="50px"
                width="300px"
                v-model="searchParams.IMP_RESULT"
                :items="codeList.IMP_RESULT"
                item-value="COD"
                item-title="TXT"
              /> -->
              <i-select
                :label="$t('모듈')"
                label-width="50px"
                width="300px"
                v-model="searchParams.LINK"
                :items="codeList.LINK"
                item-value="COD"
                item-title="TXT"
              />
              <div class="d-flex">
                <i-select 
                  :label="$t('검색')"
                  width="200px"
                  label-width="50px"
                  v-model="searchParams.SEARCH_TYPE"
                  :items="codeList.SEARCH_TYPE"
                  item-value="COD"
                  item-title="TXT"
                />
                <i-input
                  v-model="searchParams.RISK_NM"
                  width="400px"
                  append-inner-icon="mdi-magnify"
                  @keydown="e => { if(e.keyCode == 13) onButtonsClick({ id :'btnSearch' }) }"
                />
              </div>
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys" 
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
            />
          </v-sheet>
        </div> 
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

</style>
