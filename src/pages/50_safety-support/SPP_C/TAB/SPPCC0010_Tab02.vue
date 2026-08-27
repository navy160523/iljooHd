<script setup>
import { ref, reactive, onMounted, getCurrentInstance, onBeforeMount , watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi,commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import { commonSampleDownFilesApi } from "@hiway/api/commonFileApi";

import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import IButtonList from '@/components/IButtonList.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import RegisterPopup from "@/pages/50_safety-support/SPP_C/popup/SPPCC0010Popup01.vue"
import IUploadPopupMain from "@/components/popup/IUploadPopup.vue"



defineOptions({
  name: '50_safety-support-SPP_C-TAB-SPPCC0010_Tab01',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea1 = ref(null)
// const searchRightArea = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const registerPopup = ref(null)
const isReadonly = ref(true)
const fileUploadPopup = ref(null)

let type = '' // 팝업 좌,우측 구분
let addState1 = false // 좌측 데이터 추가 가능 여부

/* 좌측 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: '', // 부서 코드
  ASGN_CD: '', // 협력사 코드
  DATE_YN: 'Y', // 중지일자 사용 여부
  JSTOP_DATE_FR: dayjs().startOf('month').format("YYYY-MM-DD"), // 중지일자 조회 시작일
  JSTOP_DATE_TO: dayjs(new Date()).format("YYYY-MM-DD"), // 중지일자 조회 종료일
  JSTOP_DIV: '',
  JSTOP_DIV_OPTION: '', // 전체, 합의, 일방
  JSTOP_EMP_NO: '', // 작업중지자
  USER_DIV: 'Y', // 과거 조직포함 여부
  ADMIN: 'Y', // 권한 확인에 따른 조회 조건 차이 (현재는 고정 코드로 사용)
})



/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [], // 사업부 목록
  DEPT_CD: [], // 부서 목록
  ASGN_CD: [], // 협력사 목록
  JSTOP_DIV:[
    {COD:'', TXT:'전체'}
    ,{COD:'10', TXT:'민원 점검관련'}
    ,{COD:'20', TXT:'사고 관련'}
  ],  // 중지 구분
  JSTOP_DIV_OPTION:[ // 중지 구분 추가 옵션
    {COD:'', TXT:'전체'}
    ,{COD:'1', TXT:'합의'}
    ,{COD:'2', TXT:'일방'}
  ],
  JSTOP_EMP_NO: []
})

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
      // SAVE_FLAG[2]
      commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
          USE_DIV: 'Y',
        }
      }),
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_DIV: searchParams.USER_DIV },
      }), // 부서
      commonSearchApi(// 작업중지자 목록
      { queryId : 'SPPCC0010_SEARCH_02',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
        }
      }),
      commonSearchApi({ queryId : 'searchVend', param : { 
        CMPNY_DIV: userStore.cmpnyDiv
        , BSNS_CD: searchParams.BSNS_CD
        , DEPT_CD: '' } }),
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.JSTOP_EMP_NO = res[3].ORESULT_CUR
    codeList.ASGN_CD = res[4].ORESULT_CUR

    // codeList.DATE_LIST.unshift({ TXT:'전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD: '' })
    codeList.JSTOP_EMP_NO.unshift({ EMP_NM:'전체', EMP_NO: '' })
    codeList.ASGN_CD.unshift({ ASGN_NM:'전체', ASNG_CD: '' })

    grdMain.value.setBindingColumn(
        "JSTOP_DIV",
        codeList.JSTOP_DIV,
        "COD",
        "TXT"
      ); // 회사구분
  })
}

//좌측 디테일(상단) 그리드
const grdMainProps = reactive({
  gridViewOption: { 
    edit: { editable: false },  checkBar: { visible: false } },
  fields : [ 
    { fieldName: 'JSTOP_DT',width:'100', dataType: 'text', header: { text:'중지일자' }, editable: false },
    { fieldName: 'JSTOP_TIME',width:'100', dataType: 'text', header: { text:'중지시간' }, editable: false },
    { fieldName: 'RESTART_DT',width:'100', dataType: 'text', header: { text:'재개일자' }, editable: false },
    { fieldName: 'RESTART_TIME',width:'100', dataType: 'text', header: { text:'재개시간' }, editable: false },
    { fieldName: 'ASGN_NM',width:'250',styleName:'left-column' ,dataType: 'text', header: { text:'작업조직' }, editable: false },
    { fieldName: 'CHG_EMP_NM',width:'60', dataType: 'text', header: { text:'담당자' }, editable: false },
    { fieldName: 'WORKER_CNT',width:'60', dataType: 'text', header: { text:'인원' }, editable: false , styleName: 'right-column' },
    { fieldName: 'JSTOP_DIV', dataType: 'text',width:'80', header: { text:'중지구분' }, editable: false,lookupDisplay: true, },
    { fieldName: 'JSTOP_DIV_OPTION', dataType: 'text', width:'125' ,header: { text: t('합의/일방') }, editable: false
    , renderer: { type: 'html', 
    callback: (grid, model, field) =>{ return GBNSubCallback(grid, model, field) } }, readonly: true},
    { fieldName: 'JOB_SPLC_NM',width:'150', dataType: 'text', header: { text:'장소분류' }, editable: false },
    { fieldName: 'JOB_PLC_DESC',width: '150', dataType: 'text', header: { text:'작업장소' }, editable: false, styleName: 'left-column'},
    { fieldName: 'JSTOP_DESC',width: '300', styleName: 'left-column',dataType: 'text', header: { text:'중지사유' }, editable: false },
    { fieldName: 'RESTART_DIV_NM',width:'60', dataType: 'text', header: { text:'조치구분' }, editable: false },
    { fieldName: 'JSTOP_EMP_NM',width:'75', dataType: 'text', header: { text:'작업중지자' }, editable: false },
    { fieldName: 'RESTART_DESC',width:'300', dataType: 'text', header: { text:'조치결과' }, editable: false },
    { fieldName: 'LOSS_TIME',width:'60', dataType: 'text', header: { text:'시간손실' }, editable: false, styleName: 'right-column' },
    { fieldName: 'LOSS_MH',width:'60', dataType: 'text', header: { text:'손실M/H' }, editable: false , styleName: 'right-column'},
    { fieldName: 'SHIP_NO',width:'80', dataType: 'text', header: { text:'호선번호' }, editable: false },
    { fieldName: 'FILE_NM', dataType: 'text', header: { text:'첨부파일' }, editable: false ,
    renderer: {
      type: "html",
        callback: function (grid, cell, w, h) {
          
          let str = ''
          if(cell.value !== undefined && cell.value !== null && cell.value !== ''){
            str = `
            <div style="display: flex; justify-content: center;
              padding-left: 10px; padding-right: 10px">
                <button id="cellButton" style="height: 30px;">
                  <span class="mdi mdi-arrow-down-bold-box-outline text-light-blue-darken-1"
                style="font-size: 22px ;display: flex; align-items: center;"/>
                </button>
              </div>`
          }
          
          return str;
        },
      },
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_NO', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },

  ],
  columns: [],
})
    
grdMainProps.columns = grdMainProps.fields


//////////////////////////////////////////////메인 버튼 클릭이벤트
//좌측
const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){ //대상 조회
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SPPCC0010_SEARCH_04',
        param: searchParams }),
    ]).then(res => {
      // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      grdMain.value.getGridView().setFocus(0)
      
  })
  }else if(btn.id === 'btnCreate'){ //추가 (팝업 오픈)
    registerPopup.value.openPopup({NEW_YN: 'Y'})
  }
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(delCheck1)
      .setQuery(delData1)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run();
  }
}



const GBNSubCallback = (grid, model, field) => {
  let checkedA = '' // 합의
  let checkedB = '' // 일방

  if(model._index.value === '1'){
    checkedA = 'checked'
  } else if(model._index.value === '2'){
    checkedB = 'checked'
  } 

  return "<input type='radio' " + "value='1'  onclick='return false;'" + "name=" + "'group" + model._index.dataRow + 'C' + "' " + checkedA + " />" + 
    "<span style='padding: 0 10px 0 10px !important;'>합의</span>" +
    "<input type='radio' " + "value='2' onclick='return false;'" + "name=" + "'group" + model._index.dataRow + 'D' + "'" + checkedB + "  />" +
    "<span style='padding: 0 10px 0 10px !important;'>일방</span>" 
}



const onCellItemClicked = (grid, index, col) => {
  if(col.target.classList[0]==="mdi"){ 
    //선택 행 데이터

    const selectRow = grdMain.value.getRowData(index.dataRow)
    // console.log('selectRow',selectRow)
    let fileID = ''
    // fileUploadPopup.value.setGuid()
    // fileID = selectRow.TRAINING_ATTACH_KEY
    // fileUploadPopup.value.openPopup(fileID)
    // type = 'right'
    // 메인쪽 데이터 추가 비활성화 
    fileUploadPopup.value.setGuid()
    // 선택 행의 파일 id
    fileID = selectRow.FILE_ID
    fileUploadPopup.value.openPopup(fileID)
  }
}

onMounted(() => {
  // 그리드 데이터 바인딩
  initCodeList()
  // console.log('dayjs test', dayjs().startOf('month'))
  onButtonsClick({id:'btnSearch'})
})




</script>

<template>

<v-card class="pa-1 fill-height">
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet height="100%" style="display: flex; flex-direction: row;">
          <v-sheet width="100%" style="padding-right: 5px;">
            <IMenuTitle
              :button-list="['btnSearch']"
              :title="'노동조합 작업중지 현황'"
                @click-button="onButtonsClick">
                <template #editors />
            </IMenuTitle>
            <v-sheet class="searchArea" style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center;">              
                <i-input
                  v-model="searchParams.JSTOP_DATE_FR"
                  type="date"
                  :label="$t('중지일자')"
                  margin="10px"
                  width="201px"
                />
                <i-input
                  v-model="searchParams.JSTOP_DATE_TO"
                  width="160px"
                  :label="$t('~')"
                  type="date"
                />
                <i-select
                  :label="$t('사업부')"
                  label-width="40px"
                  width="200px"
                  v-model="searchParams.BSNS_CD"
                  :items="codeList.BSNS_CD"
                  item-value="BSNS_CD"
                  item-title="BSNS_NM"
                />
                <i-select
                  :label="$t('중지구분')"
                  label-width="60px"
                  width="220px"
                  v-model="searchParams.JSTOP_DIV"
                  :items="codeList.JSTOP_DIV"
                  item-value="COD"
                  item-title="TXT"
                />
                <div style="padding-right: 12px;">
                  <v-radio-group inline v-model="searchParams.JSTOP_DIV_OPTION">
                      <v-radio label="전체" value=""></v-radio>
                      <v-radio label="합의" value="1"></v-radio>
                      <v-radio label="일방" value="2"></v-radio>
                  </v-radio-group>
                </div>
            </div>
              
            </v-sheet>
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellItemClicked="onCellItemClicked"
              />
          </v-sheet>
          <!-- 우측 상단 칸-->
        </v-sheet>
      </div>
    </v-card-text>
  </v-card> 
  <IUploadPopup
      ref="fileUploadPopup"
      :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
      :autoUpload="true"
      :fileDan="true"
      :img-only=true
      :isVisibled="false"
      />
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 200px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}

</style>