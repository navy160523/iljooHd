<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import ImageViewerPopup from "@/components/popup/ImageViewerPopup.vue"
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import SPPCA0010Popup from '../SPP_C/popup/SPPCA0010Popup.vue'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from "@/utils/excel"

defineOptions({
  name: 'SPPCA0010',
})
 

onMounted(() => {
  initCodeList()
});

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const popup = ref(null)
var disabledPK = ref(true)
var disabledNON_PK = ref(true)
const imageViewerPopup = ref(null)
const SPPCA0011 = ref(null)        // 상세 팝업

// 관리자 및 사용자 구분 (화면 담당자(김태송 책임))
const  isAdmin = ref(userStore.userId === 'A504638' || userStore.userId === 'BP21926' ? true : false)

const searchParams = reactive({
  YEAR: dayjs().get("year"),
  CMPNY_DIV: '',
  BSNS_CD: '',
  DPET_CD: '',
  ASGN_NM: '',
  SUPVISN_TYPE: '',
  SEQ: '',
})

var mainContents = reactive({
  CMPNY_DIV: '',
  YEAR: '',
  SEQ: '',
  SUPVISN_TYPE: '',
  DATE_FROM: '',
  DATE_TO: '',
  REMARK: '',
  FILE_ID: '',
  FILE_YN: '',
  SAVE_YN: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : [],
  fields : [ 
    { fieldName: 'ODRNUM', dataType: 'text', header: { text:'연번' }, editable: false, width: "40" },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text:'사업부' }, editable: false, width: "100"},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text:'조치부서' }, editable: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text:'부서코드' }, editable: false, width: "80"},
    { fieldName: 'VEND_NM', dataType: 'text', header: { text:'협력사' }, editable: false },
    { fieldName: 'PLACE', dataType: 'text', header: { text:'장소(설비)' }, editable: false, width: "200"},
    { fieldName: 'PLACE_DTL', dataType: 'text', header: { text:'세부장소' }, editable: false },
    { fieldName: 'VIO_TYPE', dataType: 'text', header: { text:'대분류' }, editable: false },
    { fieldName: 'VIO_TYPE_DTL', dataType: 'text', header: { text:'대상물(자)' }, editable: false },
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text:'위반내용' }, editable: false, width: "200" },
    { fieldName: 'LAW', dataType: 'text', header: { text:'적용법조' }, editable: false, width: "80" },
    { fieldName: 'RULE', dataType: 'text', header: { text:'적용규칙' }, editable: false, width: "80" },
    { fieldName: 'MEASURE', dataType: 'text', header: { text:'처분' }, editable: false, width: "80" },
    { fieldName: 'STATUS_NM', dataType: 'text', header: { text:'진행상태' }, editable: false, width: "80" },
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'YEAR', dataType: 'text' , visible: false },
    { fieldName: 'SEQ', dataType: 'text' , visible: false },
    { fieldName: 'SUBSEQ', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'PROBLEM_FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'MEASURE_FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'PROBLEM_DESC', dataType: 'text' , visible: false },
    { fieldName: 'MEASURE_DESC', dataType: 'text' , visible: false },
  ],
  columns: [
  ],
})

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  CMPNY_DIV: [],     // 회사구분
  BSNS_CD: [],       // 사업부
  DEPT_CD: [],       // 부서
  SUPVISN_TYPE1: [], // 조회조건 감독형태
  SUPVISN_TYPE2: [], // 감독개요 감독형태
  SEQ: [],           // 차수
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사구분
    getCompanyList(),
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv} }),
    // 부서
    commonSearchApi({queryId : 'searchDept3', param : {CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_DIV:'Y'}}),
    // 감독형태
    getCodeList('HHIFI10'),
    getCodeList('HHIFI10'),
    // 차수
    commonSearchApi({ queryId: "SPPCA0010_SEARCH_SEQ", param: {CMPNY_DIV: userStore.cmpnyDiv, YEAR: searchParams.YEAR, SUPVISN_TYPE: ''} }),
  ]).then(res => {

    //회사구분 콤보박스
    codeList.CMPNY_DIV = res[0].ORESULT_CUR

    //사업부 콤보박스
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })

    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })

    // 감독형태
    codeList.SUPVISN_TYPE1 = res[3].ORESULT_CUR
    codeList.SUPVISN_TYPE1.unshift({ TXT: "전체", COD: "" })
    codeList.SUPVISN_TYPE2 = res[4].ORESULT_CUR
    codeList.SUPVISN_TYPE2.unshift({ TXT: "", COD: "" })

    codeList.SEQ = res[5].ORESULT_CUR
    codeList.SEQ.unshift({ TXT: "", COD: "" })

    searchParams.CMPNY_DIV = userStore.cmpnyDiv
    // searchParams.BSNS_CD = userStore.bsnsCd
    // searchParams.DEPT_CD = userStore.deptCd 
  })
}

const yearChange = e => {
  setSEQ();
}

// 회사명 변경 시 작동
const companyChange = async e => {
  codeList.BSNS_CD = []
  Promise.all([
    await commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: searchParams.CMPNY_DIV,
          USE_DIV: 'Y'
        }
      }
    )
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    searchParams.BSNS_CD = ''
  })
  bsnsChange();
  setSEQ();
}

// 사업부 변경 시 작동
const bsnsChange = async e => {
  codeList.DEPT_CD = []
  if(searchParams.BSNS_CD !== ''){
    Promise.all([
      // 부서[0]
      await commonSearchApi({
        queryId : 'searchDept3',
        param : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          USE_DIV:'Y'
        }
      })
    ]).then(res => {
      codeList.DEPT_CD = res[0].ORESULT_CUR // 부서
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
      searchParams.DEPT_CD = ''
    })
  }
}

const setSEQ = async e => {
  codeList.SEQ = []
  Promise.all([
    await commonSearchApi({ 
      queryId: "SPPCA0010_SEARCH_SEQ", 
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV, 
        YEAR: searchParams.YEAR, 
        SUPVISN_TYPE: ''
      }
    })
  ]).then(res => {
    codeList.SEQ = res[0].ORESULT_CUR // 부서
    codeList.SEQ.unshift({ TXT:"", COD:"" }) 
    searchParams.SEQ = ''
  })
}

// 파일 첨부 팝업 오픈
const openFilePop = () =>{
  let fileID = null;

  // Main이 저장상태인 경우만
  if (mainContents.SAVE_YN == "Y"){
    if (mainContents.FILE_ID != ""){
      imageViewerPopup.value.setGuid();
    }

    fileID = mainContents.FILE_ID ? mainContents.FILE_ID : imageViewerPopup.value.guid;
    imageViewerPopup.value.openPopup(fileID);
  }
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {  // 조회

    if (!searchParams.YEAR){
      Message.warn('조회조건 년도를 입력해주세요.')
      return
    }

    if (!searchParams.CMPNY_DIV){
      Message.warn('조회조건 회사구분을 입력해주세요.')
      return
    }

    // Main 조회
    searchMain();

    // 상세 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnCreate') { // 추가
    addData()
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    saveData()
  }
  else if (btn.id === 'btnDelete') {  // 삭제
    deleteData()
  }
}

//메뉴버튼2
const onButtonsClick2 = btn => {
  if (btn.id === 'btnSampleDown') {  // 양식 다운로드
    let params = {
      FILE_PATH: 'SPPC',
      FILE_NAME: 'SPPCA0010.xlsx',  
    }
    commonSampleDownFilesApi(params)
  }
  else if (btn.id === 'btnExcelUpload'){ // 엑셀 업로드
    if (mainContents.SAVE_YN === "Y"){
      const input = document.createElement('input')
    
      input.type = 'file'
      input.onchange = function(event) {
        const selectedFile = event.target.files[0]
        // 선택된 파일에 대한 처리
        getJsonFromExcel(selectedFile, excelUploadCallback)
      }
      input.click()
    }else{
      Message.warn('조회 또는 저장 후 업로드 하세요.')
    }
  }
  else if (btn.id === 'btnCreate') { // 추가

    if (mainContents.SAVE_YN === "Y"){
      SPPCA0011.value.openPopup(mainContents)
    }else{
      Message.warn('조회 또는 저장 후 추가 하세요.')
    }
  } 
  else if (btn.id === 'btnDelete') {  // 삭제

    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete2)
      .setQuery(deleteData2)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

const searchMain = () => {
  disabledPK.value = false;
  disabledNON_PK.value = false;

  Promise.all([
    commonSearchApi({ queryId: "SPPCA0010_SEARCH_01", param: searchParams }).then(
      res => {
        if (res.ORESULT_CUR.length > 0){
          mainContents = res.ORESULT_CUR[0];
          disabledPK.value = true;
        }else{
          mainContents = [];
          disabledPK.value = true;
          disabledNON_PK.value = true;
        }
      }
    )
  ]) 
}

/* ---------- 조회 ---------- */
const searchData = () => {  return commonSearchApi({
    queryId: "SPPCA0010_SEARCH_02",
    param: searchParams,
  })
}

const afterSearch = res => {
  let searchData = res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(searchData);
}

/* ---------- 추가 ---------- */
const addData = () => {
  disabledPK.value = false;
  disabledNON_PK.value = false;

  imageViewerPopup.value.setGuid();

  mainContents.YEAR = searchParams.YEAR;
  mainContents.CMPNY_DIV = searchParams.CMPNY_DIV;
  mainContents.SEQ = Number(codeList.SEQ[codeList.SEQ.length - 1].COD) + 1; //codeList.SEQ.length;
  mainContents.SUPVISN_TYPE = "";
  mainContents.DATE_FROM = "";
  mainContents.DATE_TO = "";
  mainContents.REMARK = "";
  mainContents.FILE_ID = imageViewerPopup.value.guid;
  mainContents.FILE_YN = "N";
  mainContents.SAVE_YN = "N";

  grdMain.value.getDataProvider().setRows();
}

const beforeSave = () => {
  return true
}

/* ---------- 저장 ---------- */
const saveData = async () => {
  
  if(!mainContents.YEAR){
    Message.warn('감독개요 년도를 입력하세요.')
    return
  }

  if(!mainContents.SUPVISN_TYPE){
    Message.warn('감독개요 감독형태를 입력하세요.')
    return
  }

  if(!mainContents.DATE_FROM){
    Message.warn('감독기간 시작일을 입력하세요.')
    return
  }

  if(!mainContents.DATE_TO){
    Message.warn('감독기간 종료일을 입력하세요.')
    return
  }

  await vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SPPCA0010_SAVE_01', 
        list: [mainContents]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('저장 되었습니다.'));
          setSEQ();
          mainContents.SAVE_YN = "Y";
          disabledPK.value = true;
        }
      })
    }
  })
}

/* ---------- 삭제 ---------- */
const deleteData = async () => {
  await vm.$swal({ 
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({ 
        queryId : 'SPPCA0010_DELETE_01',
        list: [mainContents]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
          setSEQ();
          disabledPK.value = false;
          disabledNON_PK.value = false;
          mainContents = [];
          disabledPK.value = true;
          disabledNON_PK.value = true;
          grdMain.value.getDataProvider().setRows();
        }
      })
    }
  })
}

/* ---------- 삭제 ---------- */
const beforeDelete2 = () => {
  
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length < 1){
    Message.warn('선택된 행이 없습니다.')
    return
  }
  
  return true
}

/* ---------- 상세 삭제 ---------- */
const deleteData2 = () => {

  let deleteParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
    
  checkedRows.forEach((e)=>{
    const data =  grdMain.value.getRowData(e)
    deleteParams.push(data)
  })
  return commonExecuteApi({ queryId : 'SPPCA0010_DELETE_02', list: deleteParams })
}

/* ---------- 엑셀 업로드 ---------- */
const excelUploadCallback = async excelData => {

  var mappedData = excelData.map(item => {
    return {
      // 그리드 필드명  : 엑셀파일 해더
      CMPNY_DIV: mainContents.CMPNY_DIV,
      YEAR: mainContents.YEAR,
      SEQ: mainContents.SEQ,
      ODRNUM: item.연번,
      BSNS_NM: item.사업부,
      DEPT_NM: item.조치부서,
      VEND_NM: item.협력사,
      PLACE: item.장소,
      PLACE_DTL: item.세부장소,
      VIO_TYPE: item.대분류,
      VIO_TYPE_DTL: item.대상물,
      LAW: item.적용법조,
      RULE: item.적용규칙,
      MEASURE: item.처분,
      VIO_DESC: item.위반내용,
      USER_ID: userStore.userId
    }
  })

  // const uniqueData = Array.from(new Set(mappedData.map(item => item.EMP_NO))).map(employeeNo => {
  // return mappedData.find(item => item.EMP_NO === employeeNo)
  // })
  
  let ck = await vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed){
    Message.warn('취소되었습니다.')
    return 
  } else{
    if(mappedData.length>0){
      commonExecuteApi({ queryId : 'SPPCA0010_UPLOAD_01', list: mappedData }).then((res)=>{
        onButtonsClick({id: 'btnSearch'})
      })
    }else{
      Message.err('저장할 데이터가 없습니다.')
    }
  }   
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  SPPCA0011.value.openPopup2(data)
}

/* ---------- 팝업 ---------- */
//팝업 오픈
const openPopup = () => {
  deptPopup.value.openPopup({ DEPT_NM: searchParams.ASGN_NM })
}

// 팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.ASGN_CD = val.DEPT_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
}

// 팝업 닫혔을때 재조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 메뉴 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="isAdmin ? [
          'btnSearch',
          'btnCreate',
          'btnUpdate',
          'btnDelete',
        ] : ['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 영역 -->
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('년도')"
              v-model="searchParams.YEAR"
              type="Number"
              width="150px"
              margin="10px"
              maxlength="4"
              label-width="40px"
              required
              @update:modelValue="yearChange"
              oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
            />
            <i-select
              :label="$t('회사구분')" 
              :items="codeList.CMPNY_DIV"
              v-model="searchParams.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              label-width="70px" 
              width="300px"
              required
              @update:modelValue="companyChange"
            />
            <i-select
              :label="$t('사업부')" 
              :items="codeList.BSNS_CD"
              v-model="searchParams.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              label-width="50px"
              width="300px"
              @update:modelValue="bsnsChange"
            />
            <i-select 
                :label="$t('부서')"
                :items="codeList.DEPT_CD"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                label-width="40px"
                width="300px"
                v-model="searchParams.DEPT_CD"
                marginBetween="20px"
            />
            <i-select
              :label="$t('감독형태')" 
              :items="codeList.SUPVISN_TYPE1"
              v-model="searchParams.SUPVISN_TYPE"
              item-value="COD"
              item-title="TXT"
              label-width="70px" 
              width="300px"
            />
            <i-select
              :label="$t('차수')" 
              :items="codeList.SEQ"
              v-model="searchParams.SEQ"
              item-value="COD"
              item-title="TXT"
              label-width="40px" 
              width="150px"
            />
          </div>
        </v-sheet>

    <v-sheet>
      <label> 감독개요 </label>
    </v-sheet>

        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('년도')"
              v-model="mainContents.YEAR"
              id = "MAIN_YEAR"
              type="Number"
              width="150px"
              margin="10px"
              label-width="40px"
              required
              :disabled="disabledPK"
            />
            <i-select
              :label="$t('감독형태')" 
              :items="codeList.SUPVISN_TYPE2"
              v-model="mainContents.SUPVISN_TYPE"
              item-value="COD"
              item-title="TXT"
              label-width="80px" 
              width="300px"
              required
              :disabled="disabledPK"
            />
            <i-input
              :label="$t('감독기간')"
              v-model="mainContents.DATE_FROM"
              type="date"
              label-width="60px" 
              width="222px" 
              required
              :disabled="disabledPK"
            />
            <i-input
            :label="$t('~ ')"
              v-model="mainContents.DATE_TO"
              type="date"
              label-width="1px" 
              width="162px"
              :disabled="disabledPK"
            />
            <i-input
            :label="$t('비고')"
              v-model="mainContents.REMARK"
              type="text"
              label-width="50px" 
              width="300px"
              :disabled="disabledNON_PK"
            />
            <i-input 
              :label="$t('PDF')"
              v-model="mainContents.FILE_YN"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openFilePop"
              label-width="50px" 
              width="200px"
              :disabled="disabledNON_PK"
            /> 

            <i-input
            :label="$t('차수')"
              v-model="mainContents.SEQ"
              type="text"
              label-width="30px" 
              width="100px"
              readonly
            />
          </div>
        </v-sheet>

        <!-- 메인그리드 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <IGridTitle
            :button-list="isAdmin ?
            [
              'btnSampleDown',
              'btnExcelUpload',
              'btnCreate',
              'btnDelete',
            ] : []"
            @click-button="onButtonsClick2"
          />
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      
    </v-card-text>
  </v-card>
  <SPPCA0010Popup ref="SPPCA0011" @closePopup="closedPopup" />

  <div>
    <ImageViewerPopup ref="imageViewerPopup" />  
    <!-- <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    />
    <SPPCA0010Popup
      ref="popup"
    /> -->
  </div>
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