<!-- 
  화면명   : Hi-SAFE 주제 현황 조회
  화면개요 : Hi-SAFE 주제 현황을 조회하고 관리, 등록페이지로 이동 및 메일 발송 기능이 포함되어 있음
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi , getCodeList } from "@hiway/api/commonApi"
defineOptions({
  name: '40_safety-risk-SRM_C-SRMCA0020',
})
import { useRouter } from "vue-router"
import ILabel from "@/components/ILabel.vue"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

// 팝업
// Hi-SAFE 주제 등록/관리 팝업
import HiSafePopup from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup01.vue'
import NewHiSafePopup from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup01.vue'

import EmpPopup from '@/components/popup/EmpPopup.vue'// 인원 검색 팝업

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const searchArea = ref(null)
const dialog = ref(false)
const grdMain = ref(null)
const empPopup = ref(null)
const menuTitle = ref(null)
const hiSafePopup = ref(null)
const newHiSafePopup = ref(null)
const editorProps = ref(null)
/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD:'',
  PART_CD: '',
  DEPT_CD: '',
  DATE: dayjs(new Date).format('YYYY'),
  EMP_NO:'',
  EMP_NM:'',
  TASK_NO:'',
  TASK_TITLE:'',
  SAVE_FLAG: '',
  EXCELLENT: '',
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  PART_CD: [],
  DEPT_CD: [],
  SAVE_FLAG: [],
  DATE_LIST: [],
  GRADE: [],
  TASK_TYPE: [],
  EXCELLENT: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '최우수' },
    { COD: 'B', TXT: '우수' },
    { COD: 'C', TXT: '장려' },
    { COD: 'D', TXT: '이벤트포상' }
  ]
})
//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {checkBar: { visible: true }},
  keys : ['TASK_NO'],
  fields : [ 
    { fieldName: 'EXCELLENT_NM', dataType: 'text', header: { text: t('등급') }, visible: false },    
    { fieldName: 'EXCELLENT', dataType: 'text', header: { text: t('등급') },
      editable: false, width: "60",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var val = cell.value
          var text = ''
          codeList.EXCELLENT.forEach((e)=>{
            if(val === e.COD){
              text = e.TXT
            }  
          })
          var str = 
          `<div style="display: flex; justify-content: space-between;">
            <p style="display: flex; align-items: center; justify-content: center; width: -webkit-fill-available; overflow-x: hidden;">
              ${text}
            </p>
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-pencil text-light-blue-darken-1"
               style="font-size: 22px ;display: flex; align-items: center;"/>
            </button>
          </div>`
          return str;
        },
      }, 
    },
    { fieldName: 'YEAR_DATE', dataType: 'text', header: { text: t('연도') },
     editable:false,width: "60"  },
    { fieldName: 'TASK_NO', dataType: 'text',width: "80", header: { text: t('주제번호') } , editable:false},
    { fieldName: 'IMP_PLAN_TERM', dataType: 'text',width: "150", header: { text: t('개선계획기간') } , editable:false},
    { fieldName: 'CMPNY_NM', dataType: 'text', header: { text: t('회사') } , visible:false},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') } , editable:false},
    { fieldName: 'PART_NM', dataType: 'text', visible: false , header: { text: t('부문') } },
    { fieldName: 'SECTOR_NM', dataType: 'text', visible: false , header: { text: t('담당') } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } , editable:false},
    { fieldName: 'TITLE', dataType: 'text', header: { text: t('개선주제명') } 
    , editable:false, width: "300", styleName: 'left-column' },
    { fieldName: 'IMP_PLAN_FROM', dataType: 'text', header: { text: t('개선계획기간(From)') } , visible:false},
    { fieldName: 'IMP_PLAN_TO', dataType: 'text', header: { text: t('개선계획기간(To)') } , visible:false},
    { fieldName: 'IMP_PLAN_MOVE', dataType: 'text', header: { text: t('주제관리\n이동') } 
    , editable:false ,width: "35",
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div style="display: flex; justify-content: center;">
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-file-edit-outline text-light-blue-darken-1" style="font-size: 22px;"/>
            </button>
          </div>`
          return str;
        },
      }, 
    },
    { fieldName: 'SAVE_FLAG', dataType: 'text', header: { text: t('진행 상태') } 
    , editable:false
    , renderer:{
        type:'html',
        callback: function(grid,cell,w,h){
          let result = ''
          codeList.SAVE_FLAG.forEach((e)=>{
            if(e.COD === cell.value){
              result = e.TXT
            }else if(cell.value === undefined){
              result = ''
            }
          })
          return result
        }
      },
    },
    { fieldName: 'GRADE_F', dataType: 'text',width: "50", editable:false, header: { text: t('주제 등급') } },
    { fieldName: 'SCORE_F', dataType: 'text',width: "50", editable:false, header: { text: t('중간평가 점수') } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SAVE_FLAG_NM', dataType: 'text', visible: false , header: { text: t('진행 상태') } },
    { fieldName: 'GRADE', dataType: 'text', visible: false, header: { text: t('위험등급') } },
    { fieldName: 'TASK_TYPE', dataType: 'text', visible: false , header: { text: t('과제분류') } },
    { fieldName: 'TASK_COLLABOR_YN', dataType: 'text', visible: false , header: { text: t('협업과제 여부') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    { fieldName: 'EMP_NM', dataType: 'text', visible: false },
    { fieldName: 'EMAIL', dataType: 'text', visible: false },  
    { fieldName: 'TEMP_YN', dataType: 'text', visible: false },    
    { fieldName: 'EXCELLENT_REMARK', dataType: 'text', visible: false },  
  ],
  columns : [],
  
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = []

// 메뉴 버튼 (조회)
const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if (btn.id === "btnClose"){
    onClose()
  }
}

const afterSearch = (res) => {
  // console.log('search Result',res)
  let searchData = res.ORESULT_CUR
  searchData.forEach((e)=>{
    codeList.SAVE_FLAG.forEach((c)=>{
      if(c.COD === e.SAVE_FLAG){
        e.SAVE_FLAG_NM = c.TXT
      }
    })
    codeList.EXCELLENT.forEach((c)=>{
      if(c.COD === e.EXCELLENT){
        e.EXCELLENT_NM = c.TXT
      }
    })
    codeList.TASK_TYPE.forEach((c)=>{
      if(c.COD === e.TASK_TYPE){
        e.TASK_TYPE = c.TXT
      }
    })
    codeList.GRADE.forEach((c)=>{
      if(c.COD === e.GRADE){
        e.GRADE = c.TXT
      }
    })
  })
  // console.log(searchData)
  grdMain.value.getDataProvider().setRows(searchData)
  
}
//조회 코드
const searchData = () => {
  return commonSearchApi({
    queryId: "SRMCA0020_SEARCH01",
    param: searchParams,
  })
}
// 초기 조회 코드 생성
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ 
      commonSearchApi({ queryId : 'MNG_searchCommonCode',
        param: { CMPNY_DIV: userStore.cmpnyDiv,
          ALL_UP_CD: 'HHIZ000', USE_FLAG: 'Y' } }),
      // SAVE_FLAG[1]
      getCodeList('HHIJJA01'),
       // 위험등급[2]
      getCodeList('HHIJJC01'),
      // 과제분류[3]
      getCodeList('HHIJJA02'),
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    // 진행상태
    codeList.SAVE_FLAG = res[1].ORESULT_CUR
    codeList.GRADE = res[2].ORESULT_CUR
    codeList.TASK_TYPE = res[3].ORESULT_CUR
    let startDate = dayjs(new Date).format('YYYY') - 40
    let endDate = dayjs(new Date).format('YYYY')

    for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString()})
    }
    codeList.DATE_LIST.unshift({ TXT:'전체', COD: '' })
    codeList.CMPNY_DIV.unshift({ TXT:'전체', COD: '' })
    codeList.SAVE_FLAG.unshift({ TXT:'전체', COD: '' })
    
    companyChange()
  })
}
// 회사명 변경 시 작동
const companyChange = e => {
  codeList.DEPTList = []
  Promise.all([
    commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: searchParams.CMPNY_DIV,
          USE_DIV: 'Y',
        }
      }
    )
  ]).then(res => {
    // console.log(res)
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    searchParams.BSNS_CD = ''
  }) 
  bsnsChange()
  // reset()
}
// 사업부 변경 시 작동
const bsnsChange = e => {
  if(searchParams.BSNS_CD !== ''){
    Promise.all([
      // 부서[0]
      commonSearchApi({
        queryId : 'searchDept3',
        param : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          USE_DIV:'Y'
        }
      }),
      // 부문[1]
      commonSearchApi({
        queryId : 'SEARCH_PART',
        param : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: searchParams.DEPT_CD,
        }
      })
    ]).then(res => {
      codeList.DEPT_CD = res[0].ORESULT_CUR // 부서
      codeList.PART_CD = res[1].ORESULT_CUR // 부문

      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
      codeList.PART_CD.unshift({ PART_NM: "전체", PART_CD: "" })

      searchParams.DEPT_CD = ''
      searchParams.PART_CD = ''
    })
  }
}

/* 그리드 및 상세정보 초기화 */

const empOpenPopup = () => {
  // console.log('작동')
  empPopup.value.openPopup({ MULTI: false, EMP_NM: searchParams.EMP_NM, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD  })
}

const onEmpSelected = (val) => {
  // console.log('empPopup Val',val)
  searchParams.EMP_NM = val.EMP_NM
  searchParams.EMP_NO = val.EMP_NO
}
// 담당자 조회 정보 초기화
const clear = () => {
  searchParams.EMP_NO = ''
  searchParams.EMP_NM = ''
}
// Hi-Safe 주제 등록/관리 팝업 (SRMCA0010_popup01에서 데이터가 넘어오면 재조회)
const onHiSafe = val => {
  if (val === 'update') { 
    onButtonsClick({ id: "btnSearch" })
  } else if (val === 'delete') {
    onButtonsClick({ id: "btnSearch" })
  }
}

// Hi-Safe 주제 등록/관리 팝업 (SRMCA0010_popup01에서 데이터가 넘어오면 재조회)
const onNewHiSafe = val => {
  if (val === 'update') { 
    onButtonsClick({ id: "btnSearch" })
  } else if (val === 'delete') {
    onButtonsClick({ id: "btnSearch" })
  }
}
const closedPopup = () =>{
  onButtonsClick({ id: "btnSearch" })
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  initCodeList()
  // 초기 데이터 추가
  codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
  codeList.PART_CD.unshift({ PART_NM: "전체", PART_CD: "" })
  onButtonsClick({id:'btnSearch'})
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
      <span>{{'Hi-SAFE 현황 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="'Hi-SAFE 현황'"
          :button-list="['btnSearch','btnPrintList','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <div class="d-flex mb-2" style="padding-left: 15px;">
                
                <i-select 
                  v-model="searchParams.DATE"
                  :label="$t('연도')"
                  :items="codeList.DATE_LIST"
                  item-title="TXT"
                  item-value="COD"
                  width="235px"
                  labelWidth="61px"
                />
                <i-select 
                :label="$t('회사명')"
                :items="codeList.CMPNY_DIV"
                item-title="TXT"
                item-value="COD"
                width="220px"
                v-model="searchParams.CMPNY_DIV"
                @update:modelValue="companyChange"
                marginBetween="20px"
                />
                <i-select 
                :label="$t('사업부')"
                :items="codeList.BSNS_CD"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                width="220px"
                v-model="searchParams.BSNS_CD"
                @update:modelValue="bsnsChange"
                marginBetween="20px"
                />
                <i-select 
                :label="$t('부문')"
                :items="codeList.PART_CD"
                item-title="PART_NM"
                item-value="PART_CD"
                width="250px"
                labelWidth="59px"
                v-model="searchParams.PART_CD"
                marginBetween="20px"
                />
                <i-select 
                :label="$t('부서')"
                :items="codeList.DEPT_CD"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                width="220px"
                v-model="searchParams.DEPT_CD"
                marginBetween="20px"
                />
              
                <ILabel
                  :label="$t('담당자')"
                  label-width="220"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        v-model="searchParams.EMP_NM"
                        @keydown.enter="empOpenPopup()"
                        :readonly=false
                      >
                      <template v-slot:append-inner>
                        <v-icon
                          icon="mdi-magnify"
                          @click="empOpenPopup()"
                        />
                        <v-icon
                          icon="mdi-close-box-outline"
                          @click="clear()"
                        />
                      </template>
                      </VTextField>
                    </template>      
                </ILabel>
                
                </div>
                <div class="d-flex">
                  <ILabel
                  :label="$t('주제번호')"
                  label-width="100"
                  style="width: 265px;"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        v-model="searchParams.TASK_NO"
                        append-inner-icon="mdi-magnify"
                        @click:appendInner="onButtonsClick({id:'btnSearch'})"
                        :readonly=false
                        @keydown.enter="onButtonsClick({id:'btnSearch'})"
                      />
                    </template>      
                  </ILabel>
                
                  <ILabel
                  :label="$t('주제명')"
                  label-width="100"
                  style="width: 480px;padding-left: 5px;margin-right: 6px;"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        v-model="searchParams.TASK_TITLE"
                        append-inner-icon="mdi-magnify"
                        @click:appendInner="onButtonsClick({id:'btnSearch'})"
                        @keydown.enter="onButtonsClick({id:'btnSearch'})"
                        :readonly=false
                        
                      />
                    </template>      
                  </ILabel>
                
                  <i-select 
                    :label="$t('진행상태')"
                    label-width="70px"
                    width="250px"
                    :items="codeList.SAVE_FLAG"
                    item-title="TXT"
                    item-value="COD"
                    v-model="searchParams.SAVE_FLAG"
                  />
                  <i-select 
                    :label="$t('등급')"
                    width="220px"
                    :items="codeList.EXCELLENT"
                    item-title="TXT"
                    item-value="COD"
                    v-model="searchParams.EXCELLENT"
                    marginBetween="20px"
                  />
                  
                </div>
            </v-sheet>
          
      <!-- 메인그리드 -->
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :gridViewOption="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  
    <!-- 인원 정보 팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
    <!-- HiSafe 주제 등록/관리 -->
    <HiSafePopup ref="hiSafePopup" @updated="onHiSafe" />
    <NewHiSafePopup ref="newHiSafePopup" @updated="onNewHiSafe" />
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