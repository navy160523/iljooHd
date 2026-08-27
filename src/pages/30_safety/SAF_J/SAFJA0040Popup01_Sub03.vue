<!--
  화면명 : 공사 신청 서브 화면3
  화면개요 : 공사 신청 서브 화면 작업자 출입정보 입력화면
-->

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { commonSearchApi,commonExecuteApi,getCodeList } from '@/@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import Message from "@hiway/utils/notify";

const { t } = useI18n();

const emit = defineEmits(['close'])
//사용자 정보
const userStore = useUserStore();
//선택된 row 데이터
const checkedData = []
const gbn = ref('')

const strTm = ref('')
const enTm = ref('')
const parmNm = ref('')
const baseData = reactive({
  VEND_CD: '',
  WORK_NO: '',
  REV_NO: ''
})

//단기공사 정보 저장
//페이지 입력값
const page3 = reactive(
  {
    CMPNY_DIV:'',
    WORK_NO: '',
    VEND_CD: '',
    REV_NO: '',
    EDU01_YN: '',           // 채용시 교육
    EDU02_YN: '',           // 특별안전교육
    WORK_PIC_EMPNM: '',     // 공사책임자 성명
    WORK_PIC_MOBILE: '',    // 공사책임자 휴대폰
    WORK_OFFI_TEL: '',      // 현장전화
    WORK_PIC_EMPNM2: '',    // 차선임자 성명
    WORK_PIC_MOBILE2: '',   // 차선임자 휴대폰
    BIZ_REG_NO: '',         // 사업자번호
  }
)

let personList = reactive([])

//그리드 1,2
const grdMain = ref(null)
const grdMain2 = ref(null)
//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys: [],
  fields: [
  {
      fieldName: "BIZ_REG_NO",
      dataType: "text",
      header: { text: "BIZ_REG_NO" },
      visible: false,
      editable: false,
    },
  {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: "CMPNY_DIV" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "VEND_CD",
      dataType: "text",
      header: { text: "VEND_CD" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "WORK_NO",
      dataType: "text",
      header: { text: "WORK_NO" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "REV_NO",
      dataType: "text",
      header: { text: "REV_NO" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "MOBILE",
      dataType: "text",
      header: { text: "MOBILE" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "NAME",
      dataType: "text",
      header: { text: "이름" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "BIR_DAY",
      dataType: "text",
      header: { text: "생년월일" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "CERT_VNO",
      dataType: "text",
      header: { text: "본인인증" },
      visible: true,
      editable: false,
    },
    {
      width: '150',
      fieldName: "EDU_END_DT",
      dataType: "text",
      header: { text: "온라인교육만료일" },
      visible: true,
      editable: false,
    },
    {
      width: '150',
      fieldName: "EDU_END_DT227",
      dataType: "text",
      header: { text: "담당부서교육만료일" },
      visible: true,
      editable: false,
    },
    {
      width: '150',
      fieldName: "EDU_END_DT120",
      dataType: "text",
      header: { text: "안전부대면교육만료일" },
      visible: true,
      editable: false,
    },
    {
      width: '350',
      fieldName: "RETURN_YN",
      dataType: "text",
      header: { text: "출입불가 사유" },
      visible: true,
      editable: false,
    },

    {
      width: '350',
      fieldName: "SEQ",
      dataType: "text",
      header: { text: "SEQ" },
      visible: false,
      editable: false,
    },
    
  ],
  columns: [],
});
grdMainProps.columns = grdMainProps.fields;

//그리드 속성셋팅
const grdMainProps2 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys: [],
  fields: [
  {
      fieldName: "BIZ_REG_NO",
      dataType: "text",
      header: { text: "BIZ_REG_NO" },
      visible: false,
      editable: false,
    },
  {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: "CMPNY_DIV" },
      visible: false,
      editable: false,
    },
  {
      fieldName: "VEND_CD",
      dataType: "text",
      header: { text: "VEND_CD" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "WORK_NO",
      dataType: "text",
      header: { text: "WORK_NO" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "REV_NO",
      dataType: "text",
      header: { text: "REV_NO" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "MOBILE",
      dataType: "text",
      header: { text: "MOBILE" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "NAME",
      dataType: "text",
      header: { text: "이름" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "BIR_DAY",
      dataType: "text",
      header: { text: "생년월일" },
      visible: true,
      editable: false,
    },
  {
      fieldName: "PIC_YN",
      dataType: "text",
      header: { text: "공사책임자" },
      visible: true,
      renderer: {
        type: "check",
        trueValues: "Y", falseValues: "N",
      },
    editable: false,
    readOnly : true,
    },
    {
      fieldName: "PIC_YN2",
      dataType: "text",
      header: { text: "차선임자" },
      visible: true,
      renderer: {
        type: "check",
        trueValues: "Y", falseValues: "N",
      },
      editable: false,
      readOnly : true,
    },

    {
      fieldName: "CAR_KIND",
      dataType: "text",
      header: { text: "차종" },
      visible: true,
      editable: true,
    },
    {
      fieldName: "CAR_NO",
      dataType: "text",
      header: { text: "차번호" },
      visible: true,
      editable: true,
    },
    {
      fieldName: "INOUT_FROM",
      dataType: "text",
      header: { text: "출입시간FROM" },
      visible: true,
      editable: true,
    },
    {
      fieldName: "INOUT_TO",
      dataType: "text",
      header: { text: "출입시간TO" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "GATE_NM",
      dataType: "text",
      header: { text: "게이트" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "GATE_CD",
      dataType: "text",
      header: { text: "게이트 번호" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "SEQ",
      dataType: "text",
      header: { text: "SEQ" },
      visible: false,
      editable: false,
    },


    
  ],
  columns: [],
});
grdMainProps2.columns = grdMainProps2.fields;

const searchData = () => {
  searchData2('A')
  searchData2('B')
}

const searchData2 = (gubn) => {
  console.log('page3 ', page3)
      //작업분류
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_09",
    param: {
      CMPNY_DIV: page3.CMPNY_DIV,
      BIZ_REG_NO: page3.BIZ_REG_NO,
      VEND_CD: page3.VEND_CD,
      WORK_NO: page3.WORK_NO,
      REV_NO: page3.REV_NO,
      GUBUN: gubn,
      NAME: gubn === 'A' ? parmNm.value : '',

      PAGE_GBN: 'false',
      PAGE_NUM: '',
      PAGE_IDX: '',
    },
  }).then(res => { 
    console.log('OUTBA0020_SEARCH_09 :: ', res.ORESULT_CUR)
    if (gubn === 'A') {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)  
    } else if (gubn === 'B') {
      grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
    
  })  
}

//장소 팝업 호출
const locationPop = () => {

}

const gateSave = () => {

}

//입력데이터 부모로 전달.
const getData = () => {

let resultData = ''
resultData = page3

return resultData
}

//출입신청 인원 데이터
const getListData = () => {
  let resultData = []

  const chkRow = grdMain2.value.getGridView().getCheckedRows()

  for (let i of chkRow) {
    const data = grdMain2.value.getDataProvider().getJsonRow(i)

    if (data.INOUT_FROM !== null) {
      data.INOUT_FROM = data.INOUT_FROM.replaceAll(':', '')
    }
    
    if (data.INOUT_TO !== null) {
      data.INOUT_TO = data.INOUT_TO.replaceAll(':','')
    }

    resultData.push(data)

  }

  console.log('resultData',resultData)

  return resultData
}

const itemList1 = ref('')
const item1 =ref('')

//부모로 부터 받은 데이터 전달
const setData = (data, btnGubun) => {


      //출입용도
    // commonSearchApi({
    //   queryId: "OUTBA0020_SEARCH_01",
    //   param: {
    //   CMPNY_DIV: 'HHI',
    //   ALL_UP_CD: 'HHIE240',
    //   USE_FLAG: 'Y',
    //   CODE_NAME_TYPE: '0',
    //   PAGE_GBN: 'false',
    //   PAGE_NUM: '',
    //   PAGE_IDX: '',
    // },
    // }
  getCodeList('HHIE240').then(res => { 

    itemList1.value = res.ORESULT_CUR
    itemList1.value.unshift({ TXT: '-선택하세요-', COD: '' })  
    item1.value = ''
  })

  gbn.value = btnGubun
  console.log('SUB03 DATA ', data)
  page3.WORK_NO = data.WORK_NO
  page3.CMPNY_DIV = data.CMPNY_DIV
  page3.VEND_CD = data.VEND_CD
  page3.REV_NO = data.REV_NO
  page3.WORK_OFFI_TEL = data.WORK_OFFI_TEL
  page3.WORK_PIC_EMPNM = data.WORK_PIC_EMPNM
  page3.WORK_PIC_MOBILE = data.WORK_PIC_MOBILE  
  page3.WORK_PIC_EMPNM2 = data.WORK_PIC_EMPNM2
  page3.WORK_PIC_MOBILE2 = data.WORK_PIC_MOBILE2  

  page3.EDU01_YN = data.EDU01_YN  
  page3.EDU02_YN = data.EDU02_YN  
  page3.BIZ_REG_NO = data.BIZ_REG_NO

  searchData()
}

//출입인원추가
const addPerson = () => {
  //회사등록인원 그리드 체크row
  let chekedRow = grdMain.value.getGridView().getCheckedRows();
  //공사출입인원 그리드 데이터 전부 가져옴.
  let subGrdDataRow = grdMain2.value.getDataProvider().getJsonRows(0, -1);

  //초기화
  personList = []

  console.log('subGrdDataRow ', subGrdDataRow)
  for (let rowNum of chekedRow) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowNum)
    //확인 VALUE 
    let chkVal = true
    for (let subRowData of subGrdDataRow) {
      console.log('data ', data , 'subRowData : ', subRowData)
      if ((data.NAME === subRowData.NAME && data.BIR_DAY === subRowData.BIR_DAY)) {
        chkVal = false
      }
    }
    console.log('chkVal222 ', chkVal)
    //이미 있는 데이터는 추가 안함.
    if (chkVal) {
      data.CAR_KIND = ''
      data.CAR_NO = ''
      data.PIC_YN = 'N'
      data.PIC_YN2 = 'N'
      data.USER_ID = userStore.userId
      personList.push(data)
      chkVal = true
    }
  }

  console.log('personList ', personList)
  if (personList.length > 0) {
    grdMain2.value.getDataProvider().addRows(personList)
  }
}

//적용
const removePerson = () => {

  const chkRows = grdMain2.value.getGridView().getCheckedRows()

  console.log('chkRows ', chkRows)

  for (let i of chkRows) {
    grdMain2.value.getDataProvider().setValue(i, 'INOUT_FROM', strTm.value)
    grdMain2.value.getDataProvider().setValue(i, 'INOUT_TO', enTm.value)
    grdMain2.value.getDataProvider().setValue(i,'GATE_CD', item1.value)
  }

  grdMain2.value.commit();

}

const saveData = () => {
  
  return grdMain2.value.getDataProvider().getJsonRows(0, -1)
}

const onSubGrdCellClicked = (grid, clickData) => { 
  //기존 선택된 CHECK 값 미리 가져옴.
  const data2 = grdMain2.value.getDataProvider().getJsonRow(clickData.itemIndex)
  //공사책임자,차선임자 선택에만 작동함
  if ((clickData.column === 'PIC_YN' && data2['PIC_YN2'] === 'N') || (clickData.column === 'PIC_YN2' && data2['PIC_YN']  === 'N')) {
    
    //현재 리스트에 있는 선택된 컬럼에 해당하는 부분 전부 false 로 초기화 함,
    for (let rowNum of grid._dataProvider._rowIds) {
      const data = grdMain2.value.getDataProvider().getJsonRow(rowNum)
      if (data[clickData.column]) {
        grdMain2.value.getDataProvider().setValue(rowNum, clickData.column, 'N')
      }
    }

    //이전에 선택한 값 가져옴
    const setData = data2[clickData.column]

    console.log('setData  ' , setData)
      
    //선택한 row의 컬럼값 이전작업에서 전부 false 했기때문에 이전값의 반대값만 넣으면됨.
    grdMain2.value.getDataProvider().setValue(clickData.itemIndex, clickData.column, setData  === 'N'  ? 'Y'  : 'N')
    const curValue = grdMain2.value.getDataProvider().getJsonRow(clickData.itemIndex)
    if (clickData.column === 'PIC_YN') {
      if (setData  === 'N') {
        // console.log('PIC_YN2 :::  ', curValue)
        page3.WORK_PIC_EMPNM = curValue.NAME
        page3.WORK_PIC_MOBILE = curValue.MOBILE  
      } else {
        page3.WORK_PIC_EMPNM = ''
        page3.WORK_PIC_MOBILE = ''
      }
      
    } else if (clickData.column === 'PIC_YN2') { 
      if (setData  === 'N') {
        // console.log('PIC_YN2 :::  ', curValue)
        page3.WORK_PIC_EMPNM2 = curValue.NAME
        page3.WORK_PIC_MOBILE2 = curValue.MOBILE  
      } else {
        page3.WORK_PIC_EMPNM2 = ''
        page3.WORK_PIC_MOBILE2 = ''
      }
      // page3.WORK_PIC_EMPNM2 = curValue.NAME
      // page3.WORK_PIC_MOBILE2 = curValue.MOBILE
    }
  }
}


defineExpose({ getData, getListData , setData })

</script>

<template>
  <div class="fill-height">
      
    <i-card :title="t('회사등록인원')">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="pB-10">
          <v-col class="d-flex align-center">
            <i-input
            v-model="parmNm"
            :label="t('성명')"
            width="230px"
            labelWidth="50px"/>
            <v-btn
              color="primary"
              @click="searchData2('A')"
            >
              {{ t('검색') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row no-gutters class="pB-10">
          <v-col class="pL-3">
            <RealGrid
              ref="grdMain"
              style="height: 200px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-col>
        </v-row>
      </v-col>
    </i-card>

    <i-card style="justify-content: center;" v-if="gbn == '0'">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="pB-10">
          <i-input :label="t('출입시간')" labelWidth="80px" class="mr-2" v-model="strTm" width="210px" type="time" />
          <i-input class="" v-model="enTm" label="~" width="140px" type="time" labelWidth="10px" />
          <i-select class="" :items="itemList1" v-model="item1" item-value="COD" item-title="TXT"  width="250px" labelWidth="10px" />
          <v-btn @click="removePerson" color="primary">
            {{ t('적용') }}
          </v-btn>
        </v-row>
      </v-col>
    </i-card>
    
    <i-card :title="t('공사출입인원')" class="setSubTitle">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="pB-10">
          <v-col>
            <RealGrid
              ref="grdMain2"
              style="height: 200px;"
              :grid-view-option="grdMainProps2.gridViewOption"
              :keys="grdMainProps2.keys"
              :fields="grdMainProps2.fields"
              :columns="grdMainProps2.columns"
              @onCellClicked="onSubGrdCellClicked"
            />
          </v-col >
        </v-row>
      </v-col>
    </i-card>
    <i-card class="pb-5" title="법정 안정교육 이수 여부 확인" caption="현재 출입 신청하시는 모든 인원들이 사전에 귀사에서 시행한 법정 '채용시 교육'및'특별안전교육'을 적절히 이수하였음을 확인합니다." min-width="1200">
      <v-col class="mR-5 pa-5 bg-base">

        <v-row no-gutters class="pb-2">
        
          <span class="formLabel ml-5 mr-7">1. 채용시 교육</span>
          <v-radio-group 
            v-model="page3.EDU01_YN"
            inline
            class="workerSex">
            <v-radio class="mr-5" :value="'Y'" color="primary" label="Yes"/>
            <v-radio :value="'N'" color="primary" label="No" />
          </v-radio-group>
        
        </v-row>
        
        <v-row no-gutters>
          <span class="formLabel ml-5 mr-5">2. 특별안전교육</span>
          <v-radio-group
            v-model="page3.EDU02_YN"
            inline
            class="workerSex">
            <v-radio class="mr-5" :value="'Y'" color="primary" label="Yes"/>
            <v-radio :value="'N'" color="primary" label="No" />
          </v-radio-group>
        </v-row>
      </v-col>
    </i-card>

  </div>
</template>

<style scoped lang="scss">
.setSubTitle {
  position: relative;

  &::after {
    position: absolute;
    color: rgb(var(--v-theme-textEmphasis));
    content: "※ 출입시간,출입문은 의뢰부서 담당자가 입력이 가능합니다. 의뢰부서 담당자에게 입력요청 하시기 바랍니다.";
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.03em;
    transform: translate(20px, -479px);
    white-space: nowrap;
  }
}

.detail {
  position: relative;

  &::before {
    position: absolute;
    color: rgb(var(--v-theme-inputCheck));
    content: "※공사책임자정보는 우측 공사출입인원 하단 출입인원지정버튼에서 선택하시면 자동 세팅됩니다.";
    font-size: 12px;
    font-weight: 300;
    letter-spacing: -0.03em;
    transform: translate(0, -100%);
    white-space: nowrap;
  }
}

.formLabelText {
  inline-size: 110px;
}

.radioGroup {
  max-inline-size: 200px;
}

.leftCard {
  max-inline-size: 420px !important;
}

.textareaCol {
  max-inline-size: 515px;
  min-inline-size: 515px;

  &:has(.end) {
    max-inline-size: 535px;
    min-inline-size: 535px;
  }
}
</style>

<route lang="yaml">
  meta:
    noAuth: true
  </route>
