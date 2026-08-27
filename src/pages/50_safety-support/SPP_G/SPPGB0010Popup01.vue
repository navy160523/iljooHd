<!--
  화면명 : 공정사고조사 입력팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted, computed, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest2,
  getCodeList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import RealGrid from '@/components/RealGrid.vue'
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useLogsStore } from '@/@hiway/stores/logs'
import { commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import IButtonList from '@/components/IButtonList.vue'
import IUpload from '@/components/IUpload.vue'

dayjs.locale('ko')

const emit = defineEmits(['closed'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const menuTitle = ref(null)
// const fileUploadButton = reactive(["btnDelete"])
const titleButton = reactive(['btnSearch','btnClose']);
const isAdmin = ref(0)
const dialog = ref(false)



const codeList = reactive({
  logCmpny: [], //사고 사업부(그룹사)
  accidnetType: [], //사고유형
  hospital: [],//병원
  camera:[]
})

const selectYear =ref(null)
const selectFrMonth =ref(null)
const selectToMonth =ref(null)

const grdMain01=ref(null);

const search=ref(false)//저장시 조회
//각 항목에 들어갈 변수

const searchParams = reactive({});



const initParams = () => {
  
  selectYear.value=dayjs().format('YYYY');
  selectFrMonth.value='01'
  selectToMonth.value='12'

  applyRange(selectFrMonth.value, selectToMonth.value);

  SearchData();
}



const SearchData = async () =>
{

  searchParams.CMPNY_DIV=userStore.cmpnyDiv
  searchParams.YEAR=selectYear.value
  searchParams.FR_MONTH=selectFrMonth.value
  searchParams.TO_MONTH=selectToMonth.value

  applyRange(selectFrMonth.value, selectToMonth.value);
  

  const res= await commonSearchApi({ queryId: 'SPPGB0010_SEARCH_04', param: searchParams})
  
  if(res.ORESULT_CUR.length>0)
  {
    grdMain01.value.getDataProvider().setRows(res.ORESULT_CUR);
  }

}

// 팝업 초기세팅
const openPopup = async (data) => {
  
  // 변수 초기화 작업
  // console.log(data);
  initParams(data)

  // console.log(data);
  // if(data.DIV=='C' || (data.DIV=='M' && data.WRITE=="Y"))
  // {
  //   menuTitle.value.visibleBtn('btnUpdate', true);
  //   menuTitle.value.visibleBtn('btnTemporaryStorage', true);
  // }
  // else
  // {
  //   menuTitle.value.visibleBtn('btnUpdate', false);
  //   menuTitle.value.visibleBtn('btnTemporaryStorage', false);
  // }

  // if(data.SAVE_STAT=='C')
  // {
  //   menuTitle.value.visibleBtn('btnPrint', true);
  //   menuTitle.value.visibleBtn('btnTemporaryStorage', false);
  // }
  // else
  // {
  //   menuTitle.value.visibleBtn('btnPrint', false);
  // }

  // // 버튼 활성화 여부
  // //menuTitle.value.disableBtn(['btnUpdate'], isDisabled)
  

  dialog.value =true

}

// 바인딩 데이터 세팅
const setInfo = (isNew, data) => {
  // 권한 세팅
  isAdmin.value = data.isAdmin

  // 팝업 제목 세팅


  // 등록/수정 분기 세팅
  saveParams.SAVE_YN = isNew ? 'Y' : 'N'

  // 변경등록 세팅
  saveParams.BSNS_CD = data.BSNS_CD
  


}

// 활성화 여부(권한)
const isDisabled = computed(() => {
  let isUser = false
  let isFirst = false
  let isRegi = false
  // 1. 관리자 or 본인 (isAdmin.value > 1 || userStore.userId === saveParams.LAST_INSERT_USER_ID) 
  if(isAdmin.value > 1 || userStore.userId === saveParams.LAST_INSERT_USER_ID) {
    isUser = true
  }
  // 2. 가장 최근 등록의 수정만(SAVE_YN === 'N' && LATEST_INSERT_SEQ === 1)
  if(saveParams.SAVE_YN === 'N' && saveParams.LATEST_INSERT_SEQ === '1') {
    isFirst = true
  }
  // 3. 등록일 때(SAVE_YN === 'Y')
  if(saveParams.SAVE_YN === 'Y') {
    isRegi = true
  }
  
  return !((isUser && isFirst) || isRegi)
})

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    SearchData()
  }
  else if(btn.id=='btnClose')
  {
    closePopup();
  }

}

const closePopup = () => {
  
  // if(grdMain1.value.getDataProvider().getRowCount() < 3)
  // {
  //   saveStat.value='T'
  //   new saveFlowHelper(vm, t)
  //     .setBefore(beforeSave)
  //     .setQuery(saveData)
  //     .run()
  // }

  clearPopup();
  dialog.value = false
  emit('closed',search.value)
}
const clearPopup =()=>
{
  grdMain01.value.getDataProvider().clearRows();
}

defineExpose({
  openPopup
})

// 근무현황 그리드 속성셋팅
// const grdMain01Props = reactive({
//   gridViewOption : { 
//     edit: { editable:true },     
//     stateBar: { visible: false },
//     checkBar: { visible: true}
//   },
//   fields : [
//     { 
//       fieldName: 'DIV_NM', dataType: 'text', width: '100', styleName: 'center-column',
//       header: { text: t('구분'),} ,
//     },
//     { 
//       fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'center-column',
//       header: { text: t('내용') },
//       styleCallback: function(grid, dataCell) {
//         let ret = {}
//         const iconSize = 15
//         ret.renderer = {
//           type: 'icon',
//           iconLocation: 'right',
//           iconCallback: function(grid, cell) {
//             return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
//           },
//           iconHeight: iconSize,
//           iconWidth: iconSize,
//         }
        
//         return ret;
//       },
//     },
//     { 
//       fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
//       header: { text: t('비고') }, 
//     },
//     { 
//       fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
//       header: { text: t('순번'),} ,
//     },
//     { 
//       fieldName: 'EMP_NO', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
//       header: { text: t('구분'),} ,
//     },
//   ],
//   columns : [],

// })

// grdMain01Props.columns = grdMain01Props.fields

const grdMain01Props = reactive({
  gridViewOption: { checkBar: { visible: false },edit: { editable: false }},
  fields: [],
  columns: [],
  columnLayout:[],
});

function applyRange(frMonth, toMonth) {
  // 1) 새 fields/columns 만들기 (기존 배열 수정 X, 새로 할당)
  
  const fields = [
    { fieldName:'ROW_LABEL', datatype:'text', header:{ text: t('구분') }, width:120,
      styleName: "multiline-editor",
    // displayCallback: (grid, index, value) => {
    //   if (value === "일평균 사고출동건수") {
    //     return "일평균\n사고출동건수";  // ← 줄바꿈
    //   }
    //   return value ?? "";
    // }
    } ,
  ];

  for (let m = +frMonth; m <= +toMonth; m++) {
    const mm  = m.toString().padStart(2,'0');
    const key = 'M' + mm;
    fields.push({
      fieldName: key, datatype:'text', header:{ text: `${mm}월` }, width: 80,
      styleName: 'right-column', visible:true,
      // (grid, index, value) 시그니처
      displayCallback: (grid, index, value) => {
        const row = grid.getValues(index.itemIndex);
        if (value == null || value === '') return '';            // 값 없으면 빈칸
        return row?.ROW_LABEL === '일평균 사고출동건수' ? Number(value).toFixed(1)
                                        : String(Number(value));
      },
    });
  }

  // 2) props에 "새 배열"로 재할당 → 뼈대 변경
  grdMain01Props.fields  = fields;
  grdMain01Props.columns = fields;

  grdMain01.value.getDataProvider().setFields(grdMain01Props.fields)
  grdMain01.value.getGridView().setColumns(grdMain01Props.columns)
  grdMain01.value.getGridView().filterPanel.visible = true;
}

const checkMonth =()=>{
  if (selectFrMonth.value && selectToMonth.value) {
      if (selectFrMonth.value > selectToMonth.value) {
        // 강제로 맞추거나 경고
        selectToMonth.value = selectFrMonth.value
        // 또는 alert('시작월은 종료월보다 클 수 없습니다.')
        return Message.warn(t('시작월은 종료월보다 클 수 없습니다.'));
      }
    }
}

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1200"
    height="600"
  >
  <div class="title-bar">통합관제센터 사고/출동 현황</div>
    <v-card class="pa-3 fill-height rounded-b-5" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-sheet class="searchArea">
          <div class="d-flex align-center justify-between">
            <div class="d-flex">
            <i-select
              label-width="50px"
              width="150px"
              :label="$t('년도')"
              v-model="selectYear"
              type="YEAR"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="150px"
              :label="$t('기간')"
              v-model="selectFrMonth"
              type="MM"
              @update:modelValue="checkMonth"
            />

            <i-select
              label-width="50px"
              width="150px"
              :label="$t('~')"
              v-model="selectToMonth"
              type="MM"
              @update:modelValue="checkMonth"
            />
            </div>
            <IButtonList
              :button-list=titleButton
               @click-button="onButtonsClick"/>            
          </div>
        </v-sheet>
        <div class="d-flex flex-column">
          
            <RealGrid
              style="height:400px; width:100%;"
              ref="grdMain01"
              :grid-view-option="grdMain01Props.gridViewOption"
              :keys="grdMain01Props.keys" 
              :fields="grdMain01Props.fields"
              :columns="grdMain01Props.columns"
              />
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>

input[readonly],
textarea[readonly] {
  background-color: #f6f6f6 !important;
  color: #888 !important;
  border: 1px solid #dcdcdc !important;
  border-radius: 4px;
  opacity: 1 !important;
  margin : 1px;
}

</style>
