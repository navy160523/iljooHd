
<!-- 
  화면명   : 작업표준/위험성평가 현황 - 사고 정보 팝업
  화면개요 : 사고 발생시 신규로 작성된 작업표준의 사고 정보를 확인
-->

<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance }                   from 'vue'
import { startDragging, handleDragging, stopDragging }                    from '@/utils/useDrag.js'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n }      from 'vue-i18n'
import { useRouter }    from 'vue-router'
import queryFlowHelper  from '@/utils/searchFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel     from '@/components/ILabel.vue'
import RealGrid   from '@/components/RealGrid.vue'
import Message    from '@hiway/utils/notify'
import dayjs      from 'dayjs'
import _          from 'lodash'

defineOptions({
  name:'20_risk-assessment-RSK_B-RSKBA0020Popup1',
})

// ------------------------- Variable ------------------------- //

const dialog = ref(false)
const router = useRouter()

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const searchArea = ref(null)

const grdMain = ref(null)
const grdSub = ref(null)

let flag       = ref(1)
let filterData = ref(null)

//조회조건
let searchParams = reactive({   
  WORK_STANDARD_ID : '',
})

let mainData   = reactive({
  BSNS_NM : '',
  DEPT_NM : '',
  ORGN_NM : '',
  OCCUR_DT : '',
  SAGO_DIV_M_NM : '',
  SAGO_GAEYO : ''
})


// ------------------------- Method ------------------------- //

const openPopup = popupParam => {
  dialog.value = true
  
  mainData.BSNS_NM = ''
  mainData.DEPT_NM = ''
  mainData.ORGN_NM = ''
  mainData.OCCUR_DT = ''
  mainData.SAGO_DIV_M_NM = ''
  mainData.SAGO_GAEYO = ''

  searchParams.WORK_STANDARD_ID = popupParam.WORK_STANDARD_ID

  onButtonsClick({ id : 'btnSearch' })
}

// 조회
const searchData = () => {
  
  return commonSearchApi({ queryId : 'RSKBA0020_SEARCH03', param: searchParams })
}

const afterSearch = res => {

  let data = res.ORESULT_CUR[0]

  mainData.BSNS_NM = data.BSNS_NM
  mainData.DEPT_NM = data.INJR_DEPT_NM
  mainData.ORGN_NM = data.INJR_ORGN_NM
  mainData.OCCUR_DT = data.OCCUR_DT
  mainData.SAGO_DIV_M_NM = data.SAGO_DIV_M_NM
  mainData.SAGO_GAEYO = data.SAGO_GAEYO
  
  /*mainData = res.ORESULT_CUR[0]
  console.log('mainData 3 = ', mainData)*/
}

defineExpose({
  openPopup,
})

// ------------------------- Event ------------------------- //

const onButtonsClick = btn => {
  //console.log('데이터 조회')
  // 조회
  if (btn.id === 'btnSearch') {
    
    new queryFlowHelper(vm, t)
      //.setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnClose')
  {
    onClose()
  }
}

const onClose = () => {
  dialog.value = false
}

onMounted(() => {
  
})
</script>

<template>
  <VDialog
    v-model="dialog"
    scrollable
    width="900px"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet 
      height="50"
      color="primarySub"
      class="px-4 d-flex align-center rounded-t-5 cursor-move topBetween"
      @mousedown="startDragging"
    >
      <div>사고 정보</div>
    </v-sheet>
    
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          :hidden-manuel="true" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="table-back fill-height">
          <table class="fill-height">
            <tbody style="overflow: hidden">
              <tr class="pa-0 ma-0">
                <td 
                  class="header-back"
                  height="30"
                  width="100"
                  style="text-align: center;"
                > 사업부 </td>
                <td 
                  width="200"
                  style="padding-left: 10px;"
                > {{ mainData.BSNS_NM }} </td>
                <td
                  class="header-back"
                  width="100"
                  style="text-align: center;"
                > 부서 </td>
                <td 
                  width="200"
                  style="padding-left: 10px;"
                > {{ mainData.DEPT_NM }} </td>
                <td 
                  class="header-back"
                  width="100"
                  style="text-align: center;"
                > 업체명 </td>
                <td 
                  width="200"
                  style="padding-left: 10px;"
                > {{ mainData.ORGN_NM }}</td>            
              </tr>
              <tr class="pa-0 ma-0">
                <td
                  class="header-back"
                  height="30"
                  width="100"
                  style="text-align: center;"
                > 발생일 </td>
                <td
                  width="200"
                  style="padding-left: 10px;"
                > {{ mainData.OCCUR_DT }} </td>
                <td 
                  class="header-back"
                  width="100"
                  style="text-align: center;"
                > 유형 </td>
                <td 
                  width="500"
                  colspan="3"
                  style="padding-left: 10px;"
                > {{ mainData.SAGO_DIV_M_NM }} </td>
              </tr>
              <tr>
                <td 
                  class="header-back"
                  height="30"
                  width="900"
                  colspan="6"
                  style="padding-left: 28px;"
                > 사고내용 요약 </td>
              </tr>
              <tr>
                <td 
                  width="900"
                  colspan="6"
                  style="padding-left: 10px; vertical-align: top;"
                >
                  <div class="detail-area">
                    {{ mainData.SAGO_GAEYO }}
                  </div>
              </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>


    
  </VDialog>
</template>

<style scoped lang="scss">
/* div.v-col-md-12.v-col-12 {
  text-align: center;
  background-color: #cdd2d9;
  border-radius: 6px;
  font-size: large;
} */

.table-back {
  background-color: #ffffff;
}

.header-back {
  background-color:lightgray;
}

table, td, th {
  border : 1px solid black;
  border-collapse : collapse;
}
.detail-area {
  position: relative;
  height: 350px;
  // height: calc(100vh - 700px);
  overflow-y: auto;
  > div {
    min-height: 300px;
  }
}

.topBetween {
  justify-content: space-between;
}

input#input-33.v-field_input {
  background-color: black;
}
</style>
