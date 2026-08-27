<!--
  화면명 : MNGAA0010Popup5.vue
  화면개요 :HSE 경영시스템 모니터링 -> 전송 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCompanyList, commonSendSMS } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import dayjs from 'dayjs'
import MNGAA0010Popup6 from './MNGAA0010Popup6.vue'

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const mNGAA0010Popup6 = ref(null)

const grdTitle = reactive({
  subTitle : ''
})
const searchParams = reactive({
  CK1 : '1',   // 부서장/팀장
  CK2 : '2',   // 직책과장
  CK3 : '3',   // 운영과장
  CK4 : '4',   // 안전추진자
  CK6 : '',   // 협력사
  CK8 : '8',   // Safe Clover
  CK2_1 : '',   // 메일
  CK2_2 : '',   // 문자
  CK2_3 : '',   // 카카오
  radio: '',
  
  TABLE_NAME : '',
  YEAR : '',
  CMPNY_DIV: userStore.cmpnyDiv,
  ORGN_DIV: ' ',
  PROD_DIV : ' ',
  BSNS_CD : '',
  ASGN_CD : '',
  // USER_DIV : '',

  // BSNS_CD: '',
  // YEAR: dayjs().get("year"),
})

let columnData = ref('')

const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  field: [
    { fieldName: "ASGN_CD", dataType: "text", width: '50', styleName: "left-column", editable: false, header: { text: t("코드") } },
    { fieldName: "ASGN_NM", dataType: "text", editable: false, header: { text: t("소속") } },
    { fieldName: "EMP_NO", dataType: "text", width: '50', editable: false, header: { text: t("사번") } },
    { fieldName: "KOR_NM", dataType: "text", width: '50', editable: false, header: { text: t("성명") } },
    { fieldName: "JOB_TIT_NM", dataType: "text", width: '50', editable: false, header: { text: t("직위") } },
    { fieldName: "EMAIL", dataType: "text", width: '70', editable: false, header: { text: t("메일주소") } },
    { fieldName: "RES_NM", dataType: "text", width: '50', editable: false, header: { text: t("구분") } },
    { fieldName: "TEL_NO", dataType: "text", width: '50', editable: false, header: { text: t("사내전화") } },

    { fieldName: 'HND_PHN', dataType: 'text', visible: false  },
  ],
  columns: [],
  columnLayout: [
    {
      name: '소속',
      direction: 'horizontal',
      items: [
        'ASGN_CD',
        'ASGN_NM',
      ],
    },
    'EMP_NO',
    'KOR_NM',
    'JOB_TIT_NM',
    'EMAIL',
    'RES_NM',
    'TEL_NO',
  ]
})

grdMainProps.columns = grdMainProps.field

const openPopup = (grdData, searchParam) => {
  if(grdData[0].B2 === '0'){
    columnData.value += 'HSE 목표'
  }
  if(grdData[0].B3 === '0'){
    if(columnData.value){
      columnData.value +=', '
    }
    columnData.value += 'HSE 실적'
  }
  if(grdData[0].B4 === '0'){
    if(columnData.value){
      columnData.value +=', '
    }
    columnData.value += '위험성평가'
  }
  if(grdData[0].B5 === '0'){
    if(columnData.value){
      columnData.value +=', '
    }
    columnData.value += '환경 영향 평가'
  }
  if(grdData[0].B6 === '0'){
    if(columnData.value){
      columnData.value +=', '
    }
    columnData.value += '업무 분장표'
  }
  if(grdData[0].B7 === '0'){
    if(columnData.value){
      columnData.value +=', '
    }
    columnData.value += 'HSE 추진자 지정'
  }
  searchParams.TABLE_NAME = 'TAA3010C01'
  grdData.forEach(e => {
    searchParams.BSNS_CD += '\'' + e.BSNS_CD + '\','
  })
  searchParams.BSNS_CD = searchParams.BSNS_CD.slice(0, -1)
  searchParams.PROD_DIV = searchParam.PROD_DIV
  searchParams.ORGN_DIV = searchParam.ORGN_DIV
  searchParams.YEAR = searchParam.YEAR
  onButtonsClick({ id :'btnSearch' })
  dialog.value = true  
}

//초기 데이터셋팅
// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })


//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btn.id === "btnSendNormal"){
    send()
  } else if (btn.id === "btnClose") {
    onClose()
  }
}

/*메뉴버튼 조회*********************************************/

// 조회로직
const searchData = () => {
  return commonSearchApi({ queryId : 'MNGAA0010_POPUP_05_SEARCH_01', param: searchParams }) 
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const send = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  let sendParam = []
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }else{
    chekedRow.forEach( (val, index) => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      sendParam.push(data)
    })
  }
  if(searchParams.radio === '1'){
    // 메일 보내기
    mNGAA0010Popup6.value.openPopup('MAIL', sendParam, columnData.value, searchParams.YEAR)
  }
  // if(searchParams.CK2_1 === 'Y'){
  //   // 메일 보내기

  //   mNGAA0010Popup6.value.openPopup('MAIL', sendParam, columnData.value, searchParams.YEAR)
  // }
  else if(searchParams.radio === '2'){
    let sendParam = []
    let empNo = ''
    chekedRow.forEach( (val, index) => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      sendParam.push(data)
      empNo+=data.EMP_NO
      if(chekedRow.length-1 != index ){
        empNo+=','
      }
    })

    mNGAA0010Popup6.value.openPopup('SMS', sendParam, columnData.value, searchParams.YEAR)
  }
  // else if(searchParams.CK2_2 === 'Y'){
  //   let sendParam = []
  //   let empNo = ''
  //   chekedRow.forEach( (val, index) => {
  //     let data = grdMain.value.getDataProvider().getJsonRow(val)
  //     sendParam.push(data)
  //     empNo+=data.EMP_NO
  //     if(chekedRow.length-1 != index ){
  //       empNo+=','
  //     }
  //   })

  //   mNGAA0010Popup6.value.openPopup('SMS', sendParam, columnData.value, searchParams.YEAR)
  // }
  // else if(searchParams.CK2_3 === 'Y'){
  // }
  else{
    Message.warn(t('전송 방법을 선택 해 주세요.'))
  }
}

const onClose = () => {
  clearField()
  dialog.value = false
}

watch(() => [searchParams.CK1, searchParams.CK2, searchParams.CK3, searchParams.CK4, searchParams.CK5],([newValueCK1, newValueCK2, newValueCK3, newValueCK4, newValueCK5]) => {
  grdMain.value.getDataProvider().setRows()
})

defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

const clearField = () => {
  searchParams.CK1 = '1'
  searchParams.CK2 = '2'
  searchParams.CK3 = '3'
  searchParams.CK4 = '4'
  searchParams.CK6 = ''
  searchParams.CK8 = '8'
  searchParams.CK2_1 = ''
  searchParams.CK2_2 = ''
  searchParams.CK2_3 = ''
  searchParams.radio = ''
  searchParams.ASGN_CD = ''
  searchParams.BSNS_CD = ''
  searchParams.ORGN_DIV = ''
  searchParams.PROD_DIV = ''
  searchParams.TABLE_NAME = ''
  searchParams.YEAR = ''
  columnData.value = ''
  grdMain.value.getDataProvider().setRows(null)
}


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    height="900"
    class="p-absolute user-select-none draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>전송 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnSendNormal', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">

              <div class="d-flex" style="width:50%">
                <v-checkbox class="" label="부서장/팀장" v-model="searchParams.CK1" true-value="1" false-value=""></v-checkbox>
                <v-checkbox class="ml-5" label="직책과장" v-model="searchParams.CK2" true-value="2" false-value=""></v-checkbox>
                <v-checkbox class="ml-5" label="운영과장" v-model="searchParams.CK3" true-value="3" false-value=""></v-checkbox>
                <v-checkbox class="ml-5" label="Safe Clover" v-model="searchParams.CK8" true-value="8" false-value=""></v-checkbox>
                <v-checkbox class="ml-5" label="안전추진자" v-model="searchParams.CK4" true-value="4" false-value=""></v-checkbox>
              </div>
              
              <div class="d-flex">
                <!-- <v-checkbox class="" label="메일" v-model="searchParams.CK2_1"></v-checkbox>
                <v-checkbox class="ml-5" label="문자" v-model="searchParams.CK2_2"></v-checkbox> -->
                <!-- <v-checkbox class="ml-5" label="카카오" v-model="searchParams.CK2_3"></v-checkbox> -->
                <VRadioGroup
                  v-model="searchParams.radio"
                  class="mt-auto pl-3 pr-3 radio"
                  inline
                >
                  <VRadio label="메일" value="1"/>
                  <VRadio label="문자" value="2"/>
                  <!-- <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" /> -->
                </VRadioGroup>
              </div>

            </div>
          </v-sheet>

          <div class="d-flex fill-height">
            <v-sheet class="mr-2" width="100%">
              <RealGrid
                ref="grdMain"
                class="mt-2 mb-0"
                :gridViewOption="grdMainProps.gridViewOption"
                :fields="grdMainProps.field"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
            </v-sheet>
            
          </div>
        </div>
      </v-card-text>
      
    <!-- MNGAA0010Popup6 (전송 내용 작성 팝업) -->
    <MNGAA0010Popup6 ref="mNGAA0010Popup6" />

    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>