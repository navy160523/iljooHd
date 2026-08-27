<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonSendSMS, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import { useRouter, useRoute } from "vue-router";

defineOptions({
  name: '50_safety-support-SPP_B-TAB-SPPBD0010_Tab02',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const searchArea = ref(null)
const userId = ref(userStore.userId)
const router = useRouter();



// 코드리스트 선언
const codeList = reactive({
  ORGN_DIV: [
    { TXT: '전체', COD: '' },
    { TXT: '직영', COD: 'A' },
    { TXT: '협력사', COD: 'B' },
  ],
  CNFM_DIV: [
    { TXT: '전체', COD: 'A' },
    { TXT: '미완료', COD: 'N' },
    { TXT: '완료', COD: 'Y' },
  ],
  DATE_LIST: []
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  BSNS_NM: 'XXX사업부',
  ORGN_DIV: '',
  CNFM_DIV: 'A',
  DEPT_CD: '',
  PREVI_ROW: '',
  YEAR_DATE: dayjs().get("year").toString(),
  ALL_YN: 'N'// 칼럼 전체 표시 여부
})



//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, checkBar: { visible: true } },
  keys : ['CMPNY_DIV'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', width: '100', editable: false, header: { text: t('사업부') }
    ,footer: {
      text: "전사부서수",
    }, },
    { fieldName: 'CNT_ASGN_CD', dataType: 'number',styleName: "right-column", width: '100', editable: false, header: { text: t('부서수') }
    ,footer: {
      numberFormat: "#,##0",
      valueCallback: function (grid, column, footerIndex, columnFooter, value){
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()
        for (var i=0 ; i<cnt ; i++) {
          sum += parseInt(prod.getValue(i, 'CNT_ASGN_CD'))
        }
        return sum 
      }
    }, },
    { fieldName: 'CNT_NONE', dataType: 'number',styleName: "right-column", width: '100', editable: false, header: { text: t('미작성') }
    ,footer: {
      numberFormat: "#,##0",
      valueCallback: function (grid, column, footerIndex, columnFooter, value){
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()
        for (var i=0 ; i<cnt ; i++) {
          sum += parseInt(prod.getValue(i, 'CNT_NONE'))
        }
        return sum 
      }
    }, },
    { fieldName: 'CNT_CNFM', dataType: 'number',styleName: "right-column", width: '100', editable: false, header: { text: t('완료') }
    ,footer: {
      numberFormat: "#,##0",
      valueCallback: function (grid, column, footerIndex, columnFooter, value){
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()
        for (var i=0 ; i<cnt ; i++) {
          sum += parseInt(prod.getValue(i, 'CNT_CNFM'))
        }
        return sum 
      }
    }, },
    { fieldName: 'CNT_RATE', dataType: 'text', width: '100', editable: false, header: { text: t('진행률(%)') }
    ,footer: {
      numberFormat: "#,##0.#",
      styleName: "center-column",
      valueCallback: function (grid, column, footerIndex, columnFooter, value){
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()
        for (var i=0 ; i<cnt ; i++) {
          sum += parseInt(prod.getValue(i, 'CNT_RATE'))
        }
        return sum / cnt;  
      }
    },},

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'WK_REL_CD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM', 
    'CNT_ASGN_CD',
    {
      name: '등록현황(부서, 협력사 수)',
      direction: 'horizontal',
      items: [
        'CNT_NONE',
        'CNT_CNFM',              
        'CNT_RATE',              
      ],
      header: {
        text: t('등록현황(부서, 협력사 수)'),
      },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { header: { height: 60 }, checkBar: { visible: true } },
  keys : ['CMPNY_DIV'],
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', width: '100', editable: false, header: { text: t('부서명')
    ,footer: {
      text: "부서수",
    }, } },
    { fieldName: 'CNT_NONE', dataType: 'text', width: '100', editable: false, header: { text: t('미작성') }
    ,footer: {
      numberFormat: "#,##0",
      valueCallback: function (grid, column, footerIndex, columnFooter, value){
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()
        for (var i=0 ; i<cnt ; i++) {
          // console.log('CNT_NONE',prod.getValue(i, 'CNT_NONE'))
          if(prod.getValue(i, 'CNT_NONE')==='Y'){
            sum += 1
          }
        }
        return sum 
      }
    }, },
    { fieldName: 'CNT_CNFM', dataType: 'text', width: '100', editable: false, header: { text: t('완료') }
    ,footer: {
      numberFormat: "#,##0",
      valueCallback: function (grid, column, footerIndex, columnFooter, value){
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()
        for (var i=0 ; i<cnt ; i++) {
          if(prod.getValue(i, 'CNT_CNFM')==='Y'){
            sum += 1
          }
        }
        return sum 
      }
    }, },
    { fieldName: 'EMP_NO1', dataType: 'text', width: '100', editable: false, header: { text: t('정') } },
    { fieldName: 'EMP_NO2', dataType: 'text', width: '100', editable: false, header: { text: t('부') } },
    { fieldName: 'EMP_NO3', dataType: 'text', width: '100', editable: false, header: { text: t('데이터') } },
   
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_NM',dataType: 'text', width: '100', editable: false, header: { text: t('사업부')}, visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'WK_REL_CD', dataType: 'text', visible: false },
    { fieldName: 'WK_REL_CD2', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    'ASGN_NM', 
    {
      name: '진행 상태',
      direction: 'horizontal',
      items: [
        'CNT_NONE',
        'CNT_CNFM',              
      ],
      header: {
        text: t('진행 상태'),
      },
    },
    {
      name: '시스템 담당자',
      direction: 'horizontal',
      items: [
        'EMP_NO1',
        'EMP_NO2',    
        'EMP_NO3',              
      ],
      header: {
        text: t('시스템 담당자'),
      },
    },
  ],
})

grdSubProps.columns = grdSubProps.fields

onMounted(() => {
  // 그리드 데이터 바인딩
  initCodeList()
  grdMain.value.getGridView().footer.visible = true
  grdSub.value.getGridView().footer.visible = true
})

// 초기 조회 코드 생성
const initCodeList = () => {
  let startDate = dayjs(new Date).format('YYYY') - 40
  let endDate = dayjs(new Date).format('YYYY')

  for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString()})
    }
}




//우측 sms발신 버튼
const onButtonsClick1 = async() => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  // console.log('checkedRows.length',checkedRows.length)
  if(!(0<checkedRows.length)){
    Message.warn('대상을 선택해 주십시오.')
    return
  }
  let ck = await vm.$swal({ 
    title: t('문자를 보내시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed){
    Message.warn('취소되었습니다.')
    return 
  }
  // console.log('checkedRows',checkedRows)
  checkedRows.forEach(e=>{
    // console.log('checkedRows',e)
    const data = grdMain.value.getRowData(e)
    // console.log('checkedData',data)
    const tempData ={
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: data.BSNS_CD,
      YEAR_DATE: searchParams.YEAR_DATE,
      ORGN_DIV: searchParams.ORGN_DIV,
      DEPT_CD: data.ASGN_CD
    }
    Promise.all([
    commonSearchApi({ 
        queryId : 'SPPBD0010_SEARCH_03',
        param: tempData }),
    ]).then(res => {
      const deptList = res[0].ORESULT_CUR
      sendSMS(deptList)
    })
  })
}

//우측 sms발신 버튼
const onButtonsClick2 = async() => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows()
  // console.log('checkedRows.length',checkedRows.length)
  if(!(0<checkedRows.length)){
    Message.warn('대상을 선택해 주십시오.')
    return
  }
  let ck = await vm.$swal({ 
    title: t('문자를 보내시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed){
    Message.warn('취소되었습니다.')
    return 
  }
  // console.log('checkedRows',checkedRows)
  checkedRows.forEach(e=>{
    // console.log('checkedRows',e)
    const data = grdSub.value.getRowData(e)
    // console.log('checkedData',data)
    const tempData ={
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: data.BSNS_CD,
      YEAR_DATE: searchParams.YEAR_DATE,
      ORGN_DIV: searchParams.ORGN_DIV,
      DEPT_CD: data.ASGN_CD
    }
    Promise.all([
    commonSearchApi({ 
        queryId : 'SPPBD0010_SEARCH_03',
        param: tempData }),
    ]).then(res => {
      const deptList = res[0].ORESULT_CUR
      sendSMS(deptList)
    })
  })
}

//문자 발송 기능
const sendSMS = data => {
    data.forEach((e) => {
      let sendSMSParams = {
        EMPNO_FROM : userStore.empNo, // 보내는사람 사번 
        EMPNO_TO : e.EMP_NO, //받는사람 사번
        SYSCODE : '156',// 고정코드
        FROM_P_NO : userStore.hndPhn.replace(/-/g, ''), // 보내는사람 폰번호
        TO_P_NO : e.HND_PHN.replace(/-/g, ''),// 받는사람 폰번호
        TITLE : '[자위소방대조직도 등록요청]자위소방대조직도 등록바랍니다. -안전경영실-' // 변수명은 TITLE 이지만 문자 내용을 뜻한다
      }
      // console.log('sendSMSParams',sendSMSParams)
      // 임시 비활성화
      commonSendSMS(sendSMSParams).then(() => {
        Message.success(t('메시지 전송 완료'))
      })
    })
}

/* -------------- 조회 -------------- */

//메인 조회 버튼
const onMainButtonsClick =  () => {
  // console.log('active')
  new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()

}


const searchData = () => {
  // console.log('searchParams',searchParams)
  return commonSearchApi({ 
    queryId : 'SPPBD0010_SEARCH_04',
    param: searchParams })
}
const afterSearch = async (res) => {
  // console.log('res',res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    
  await onCellClicked({},{dataRow: 0})
}


// 좌측 그리드 셀 클릭 이벤트(사업부 별 조회)
const onCellClicked = async (grid,clickData) => {
    
  const data = grdMain.value.getRowData(clickData.dataRow)
  // console.log("클릭 데이터",data)
  const tempParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: data.BSNS_CD,
    ORGN_DIV: searchParams.ORGN_DIV,
    CNFM_DIV: searchParams.CNFM_DIV,
    YEAR_DATE: searchParams.YEAR_DATE,
  }
  searchParams.PREVI_ROW = clickData.dataRow
  searchParams.BSNS_NM = data.BSNS_NM
  searchParams.BSNS_CD = data.BSNS_CD
  if(searchParams.ALL_YN === 'Y'){
    tempParam.BSNS_CD = ''
  }
  Promise.all([ 
      // 디테일 데이터 조회 (상단 그리드)
      commonSearchApi({ 
        queryId : 'SPPBD0010_SEARCH_05',
        param: tempParam }),
  ]).then(res => {
      grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  })
}

// 우측 그리드 셀 더블클릭 이벤트
//(진행상태('Y')인 항목 더블 클릭시 조회 페이지로 이동)
const onCellDblClicked = (grid,clickData) => {
  
  let focusedRow = grdSub.value.getFocusedRowData()

  // commonStore.loading = true
  if((clickData.column === 'CNT_CNFM' && focusedRow.CNT_CNFM === 'Y')
  || (clickData.column === 'CNT_NONE' && focusedRow.CNT_NONE === 'Y')){
  window.sessionStorage.TAB_ID = 'FireBridgeRegister'
  window.sessionStorage.ASGN_CD2 = focusedRow.ASGN_CD
  window.sessionStorage.ASGN_NM2 = focusedRow.ASGN_NM
  window.sessionStorage.BSNS_CD2 = focusedRow.BSNS_CD
  window.sessionStorage.YEAR_DATE2 = searchParams.YEAR_DATE 
  window.sessionStorage.USE_YN2 = 'Y'
  // console.log('window',window)
  // 재 마운트

  router.push('/50_safety-support/SPP_B/SPPBA0010')
  }
}

// 우측 그리드 칼럼 전체 표시여부
watch(
  () => searchParams.ALL_YN,
  (newValue, oldValue) => {
    // console.log('newValue',newValue)
    // console.log('col data',grdSub.value.getGridView().columnByName("BSNS_NM"))
    if(newValue==='Y'){// 칼럼 숨기기 없음
      grdSub.value.getGridView().columnByName("BSNS_NM").visible = true;
      onCellClicked({},{dataRow: 0})
    } else{// 칼럼 숨기기 
      grdSub.value.getGridView().columnByName("BSNS_NM").visible = false;
      onCellClicked({},{dataRow: searchParams.PREVI_ROW})
    }
  }
)


</script>

<template>
  <v-card class="pa-1 fill-height">
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea" style="display: flex; justify-content: space-between;">
            <div style="display: flex;">
            <div class="formLabelText mr-5" 
              style="display: flex; align-items: center;"
              >
              <i-select
                :label="$t('조회 년도')"
                label-width="60px"
                width="200px"
                v-model="searchParams.YEAR_DATE"
                :items="codeList.DATE_LIST"
                item-value="COD"
                item-title="TXT"
              />
            </div>
            <div class="formLabelText mr-5" 
              style="display: flex; align-items: center;"
              >
                {{ $t('조직 구분') }}
              
              <VRadioGroup
                v-model="searchParams.ORGN_DIV"
                class="pl-3 pr-3 radio"
                inline
              >
                <VRadio v-for="(item, i) in codeList.ORGN_DIV" :key="i" :value="item.COD" :label="item.TXT" />
              </VRadioGroup>
            </div>
            <div class="formLabelText mr-5" 
              style="display: flex; align-items: center;"
              >
                {{ $t('완료여부') }}
            
                  <VRadioGroup
                    v-model="searchParams.CNFM_DIV"
                    class="pl-3 pr-3 radio"
                    inline
                  >
                    <VRadio v-for="(item, i) in codeList.CNFM_DIV" :key="i" :value="item.COD" :label="item.TXT" />
                  </VRadioGroup>
            </div>
          </div>
                  <v-btn class="mt-1" @click="onMainButtonsClick">
                    조회
                  </v-btn>
            
         </v-sheet>
        <v-sheet class="h-auto" style="display: flex; flex-direction: row;">
          <v-sheet width="40%" style="padding-right: 5px;">
              <span style="display: flex; justify-content: space-between; 
              width:-webkit-fill-available;">              
                <IGridTitle 
                :title="$t('전사 등록 진행 현황')"
                >
                  <template #editors />
                </IGridTitle>
                <v-btn class="mt-1" @click="onButtonsClick1" prepend-icon="mdi-email-edit-outline">
                  SMS발신
                </v-btn>
              </span>
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellClicked="onCellClicked"
              />
          </v-sheet>
          <!-- 우측 상단 칸-->
          <v-sheet width="60%" style="padding-left: 5px;">
              <span style="display: flex; justify-content: space-between; 
              width:-webkit-fill-available;">              
              <IGridTitle 
              :title="$t('사업부별('+ searchParams.BSNS_NM +')등록 진행 현황')"
              >
                <template #editors />
              </IGridTitle>
              <span style="display: flex;">
                <p style="display: flex; align-items: flex-end;
                 color:blue; padding-right: 20px; font-size: 0.8vw;">
                  조회된 데이터중 값이 'Y'인 항목을 더블클릭 하면 관련 화면으로 이동합니다.
                </p>
                <v-checkbox 
                v-model="searchParams.ALL_YN"
                :label="$t('전체보기')"
                true-value="Y"
                false-value="N"
                width="200px"
                style="padding-right: 15px;"
                />
                <v-btn class="mt-1" @click="onButtonsClick2" prepend-icon="mdi-email-edit-outline">
                  SMS발신
                </v-btn>
              </span>
              </span>
              <RealGrid
                ref="grdSub"
                class="mt-2"
                :grid-view-option="grdSubProps.gridViewOption"
                :keys="grdSubProps.keys" 
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                :column-layout="grdSubProps.columnLayout"
                @onCellDblClicked="onCellDblClicked"
              />
          </v-sheet>
        </v-sheet>
        </div>
    </v-card-text>
  </v-card>
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