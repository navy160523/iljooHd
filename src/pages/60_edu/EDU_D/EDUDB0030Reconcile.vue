<!-- eslint-disable sonarjs/prefer-object-literal -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import {
  commonReconcilePayPoint,
  commonRequest,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import axios from 'axios'

import { getQDomain } from '@/utils/common'


defineOptions({
  name: "60_edu-EDU_D-EDUDC0040",
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)

const grdMain= ref(null)




const searchParams01 = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,
  target_Date : dayjs(new Date()).format('YYYY-MM-DD'),
  target_Date_From : dayjs(new Date()).format('YYYY-MM-DD'),
  target_Date_To : dayjs(new Date()).format('YYYY-MM-DD'),
  PAGE : 1 ,
  EMP_NO: '',
  SIZE : 500,
})


//코드리스트 셋팅
const initCodeList = () => {

}

//<TAB1> 그리드 1_1 속성셋팅 
const grdProps01 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false }, footer: { visible:true }  },
  keys: [],
  fields: [
    {
      fieldName: "kaffeine_tx_id",
      header: { text: t("kaffeine_tx_id") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "transaction_type_code",
      header: { text: t("transaction_type_code") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "transaction_sub_type_code",
      header: { text: t("transaction_sub _type_code") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "request_id",
      header: { text: t("request_id") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "emp_no",
      header: { text: t("사번") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "point_seq",
      header: { text: t("Point_SEQ") },
      width: '60',
      styleName: 'right-column',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },
    {
      fieldName: "amount",
      header: { text: t("amount") },
      width: '60',
      styleName: 'right-column',
      dataType: "number",
      numberFormat: "#,###", 
      editable: false,
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    {
      fieldName: "created_at",
      header: { text: t("created_at") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "transacted_at",
      header: { text: t("transacted_at") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "updated_at",
      header: { text: t("updated_at") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "service_name",
      header: { text: t("service_name") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
  ],
  columns: [],

})

grdProps01.columns = grdProps01.fields


const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    
    reconcile()

  }

}

const searchData01 = () => {

}


const afterSearch01 = res => {

}


const validationCheck01 = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      return true
    }
  }
}


const reconcile = async() => {
  // 그리드 초기화
  grdMain.value.getDataProvider().clearRows()
 




  let currentDate = dayjs(searchParams01.target_Date_From)
  let lastDate = dayjs(searchParams01.target_Date_To)

  while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {


    // 2. 운영서버  
    
    const reconcile_param = {}
    
    reconcile_param.target_date  = currentDate.format('YYYY-MM-DD')
    reconcile_param.page  = searchParams01.PAGE
    reconcile_param.size  = searchParams01.SIZE

    console.log("reconcile: ", reconcile_param)

    let res  = await commonReconcilePayPoint(reconcile_param)
    console.log("ReconcilePayPoint res: ", res)

    // api 결과 입력
    res.forEach(value => 
    {
      // 검색조건 반영 if
      if ((searchParams01.EMP_NO == '') | (value.request_id.split('_')[1] == searchParams01.EMP_NO)){
        grdMain.value.addRow({
          kaffeine_tx_id: value.kaffeine_tx_id,
          transaction_type_code: value.transaction_type_code,
          transaction_sub_type_code: value.transaction_sub_type_code,
          request_id: value.request_id,
          emp_no: value.request_id.split('_')[1],
          point_seq: value.request_id.split('_')[2],
          amount: value.amount,
          created_at: value.created_at,
          transacted_at: value.transacted_at,
          updated_at: value.updated_at,
          service_name: value.service_name,
        }) 
      }
    })
    currentDate = currentDate.add(1, 'day') // 하루 증가

  }


  // // 1. 개발서버 

  // let tmp_res = [{ "kaffeine_tx_id":"PT003313572268813248187","transaction_type_code":"EARN","transaction_sub_type_code":"EARN","request_id":"HHI_A526166_14_90","amount":1,"created_at":"2024-06-12T09:52:44","transacted_at":"2024-06-12T09:52:44","updated_at":"2024-06-12T09:52:44","service_name":"BIZ_HYUNDAIHI" },
  //   { "kaffeine_tx_id":"PT003313570885833778872","transaction_type_code":"EARN","transaction_sub_type_code":"EARN","request_id":"HHI_A526166_11_90","amount":20,"created_at":"2024-06-12T09:47:22","transacted_at":"2024-06-12T09:47:22","updated_at":"2024-06-12T09:47:22","service_name":"BIZ_HYUNDAIHI" }]

  // // api 결과 입력
  // tmp_res.forEach(value => 
  // {
  //   // 검색조건 반영 if
  //   if ((searchParams01.EMP_NO == '') | (value.request_id.split('_')[1] == searchParams01.EMP_NO)){
  //     grdMain.value.addRow({
  //       kaffeine_tx_id: value.kaffeine_tx_id,
  //       transaction_type_code: value.transaction_type_code,
  //       transaction_sub_type_code: value.transaction_sub_type_code,
  //       request_id: value.request_id,
  //       emp_no: value.request_id.split('_')[1],
  //       point_seq: value.request_id.split('_')[2],
  //       amount: value.amount,
  //       created_at: value.created_at,
  //       transacted_at: value.transacted_at,
  //       updated_at: value.updated_at,
  //       service_name: value.service_name,
  //     }) 
  //   }
  // })


}  


onMounted(() =>{
  initCodeList()

},
)
</script>



<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!--
        타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. 
      -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!--
      content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.
    -->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- <i-input 
            v-model="searchParams01.target_Date"
            :label="$t('기준일')"
            width="250px"
            type="date"
          />-->

          <i-input 
            v-model="searchParams01.target_Date_From" 
            :label="$t('적립기간')"
            type="date"
            width="200px"
            margin="10px"
          />
          <i-input 
            v-model="searchParams01.target_Date_To" 
            :label="$t('-')"
            type="date"
            width="150px"
          />
          <i-input 
            v-model="searchParams01.EMP_NO"
            :label="$t('사번')"
            width="200px"
            type="text"
          />

          <i-input 
            v-model="searchParams01.PAGE"
            :label="$t('페이지')"
            width="270px"
            type="number"
          />
          <i-input 
            v-model="searchParams01.SIZE"
            :label="$t('사이즈')"
            width="270px"
            type="number"
          />
        </v-sheet>

        <!-- <v-btn 
          @click="reconcile"
        >
          정산대사 실시
        </v-btn> -->




        <!--
          height : 직접 지정하고싶은 높이를 설정합니다.
          만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. 
        -->
        <v-sheet
          height="90%"
          class="mb-2"
        >
          <IGridTitle :title="$t('')" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps01.gridViewOption"
            :keys="grdProps01.keys" 
            :fields="grdProps01.fields"
            :columns="grdProps01.columns"
            @onCellDblClicked="cellDbClick"
          />
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
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}
</style>
