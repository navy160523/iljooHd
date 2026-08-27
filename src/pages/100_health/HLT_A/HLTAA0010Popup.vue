<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 위험성 산출 (팝업)
-->
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from "dayjs";

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const isAdmin = ref(false);
const dialog = ref(false);
const grdMain = ref(null);
const grdSub = ref(null);

const popupParam = reactive({
  SaveData: {},
})
// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  YEAR: String(new Date().getFullYear()),
  HISTORY_YN:'',
  WORKYEAR:'',
  SPECIALYEAR:'',
  BONEYEARF:'',
  BONEYEART:'',
  HALF:'' // 반기 구분
})

const openPopup = (param) => {
  popupParam.SaveData = param
  dialog.value = true
  searchData()
}

const searchData = () => {
  Promise.all([
      commonSearchApi({
        queryId : "HLTAA0010_SEARCH_08",
        param : searchParams
      }),
      commonSearchApi({
        queryId : "HLTAA0010_SEARCH_09",
        param : searchParams
      })
  ]).then(async (res) => {
    // console.log('전' , res[0].ORESULT_CUR)
    const list = res[0].ORESULT_CUR
    const list2 = res[1].ORESULT_CUR
    list.forEach(item => {
      if(item.F_DATE === '미입력'){
        item.F_DATE = ''
      }
    })
    // console.log('list2.length : ' , list2.length)
    if (list2.length > 0) {
      searchParams.HISTORY_YN = list2[0].HISTORY_YN
    }
    // console.log('searchParams.HISTORY_YN 1234567890 : ', searchParams.HISTORY_YN)
    if (searchParams.HISTORY_YN === 'Y') {
      // 'btnCalculation','btnCancel', 
      menuTitle.value.setBtnProperty('btnCalculation', 'visible', false)
      menuTitle.value.setBtnProperty('btnCancel', 'visible', true)
    } else {
      menuTitle.value.setBtnProperty('btnCalculation', 'visible', true)
      menuTitle.value.setBtnProperty('btnCancel', 'visible', false)
    }

    list2.forEach(item => {
      const formattedDate = dayjs(item.CALCULATION_DATE, 'YYYYMMDD').format('YYYY-MM-DD')
      item.CALCULATION_DATE = formattedDate
    })
    // console.log('후' , res[0].ORESULT_CUR)
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR);
    grdSub.value.getDataProvider().setRows(res[1].ORESULT_CUR);
  })
};

const grdMainProps = reactive({
  gridViewOption: { edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NM', dataType: 'text', header: { text: t('구분') }, width: "100",  editable: false},
    { fieldName: 'CONFIRM_NM', dataType: 'text', header: { text: t('상태') }, width: "40", editable: false},
    { fieldName: 'F_DATE', dataType: 'text', header: { text: t('저장일자') }, width: "80", editable: false},
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장') },visible: false }
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: { edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'CALCULATION_DATE', dataType: 'text', header: { text: t('산출일자') }, width: "80",  editable: false},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, width: "50", editable: false},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width: "50", editable: false},
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') }, width: "50", editable: false},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, width: "50", editable: false},
    { fieldName: 'HISTORY_NM', dataType: 'text', header: { text: t('산출여부') }, width: "50", editable: false},
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장') },visible: false },
    { fieldName: 'HISTORY_YN', dataType: 'text', header: { text: t('산출여부코드') },visible: false }
    
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnCalculation') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(aftersaveData)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnCancel') {
    new saveFlowHelper(vm, t)
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('산출 내역을 삭제 합니다.')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnOutput') {
    new saveFlowHelper(vm, t)
      .setQuery(saveDataO)
      .setAfter(aftersaveDataO)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnHistory') {
    new saveFlowHelper(vm, t)
      .setQuery(saveDataH)
      .setAfter(aftersaveDataH)
      .showMessage(false)
      .run()
  }
}

// 저장 전
const beforeSave = () => {
  const dataProvider = grdMain.value.getDataProvider();
  const allRows = dataProvider.getJsonRows();
  // "미완료" 상태가 있는지 확인
  const hasUnconfirmed = allRows.some(row => row.CONFIRM_NM === '미완료');
  // console.log('미완료 항목 존재 여부:', hasUnconfirmed);
  if(hasUnconfirmed === true) {
    Message.warn(t('미완료된 기초정보가 있습니다.'))
    return false
  } else{
    // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  }
   return true
}

// 저장
const saveData = () => {
  const saveParams = popupParam.SaveData.map(item => ({
    ...item,
    WORKYEAR: searchParams.WORKYEAR,
    SPECIALYEAR: searchParams.SPECIALYEAR,
    BONEYEARF: searchParams.BONEYEARF,
    BONEYEART: searchParams.BONEYEART,
    HALF: searchParams.HALF,
    YEAR: searchParams.YEAR 
  }))
  // console.log('saveParams : ' , saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_09', list: saveParams })
}

// 저장 후
const aftersaveData = () => {
  onButtonsClick({ id: "btnOutput"})
  // searchData()
  // Message.success(t('성공적으로 확정 되었습니다'))
}

const saveDataO = () => {
  // console.log('11111')
  const saveParams = popupParam.SaveData.map(item => ({
    ...item,
    WORKYEAR: searchParams.WORKYEAR,
    SPECIALYEAR: searchParams.SPECIALYEAR,
    BONEYEARF: searchParams.BONEYEARF,
    BONEYEART: searchParams.BONEYEART,
    HALF: searchParams.HALF,
    YEAR: searchParams.YEAR 
  }))
  // console.log('saveParams : ' , saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_OUT_09', list: saveParams })
}

const aftersaveDataO = () => {
  onButtonsClick({ id: "btnHistory"})
  // searchData()
  // Message.success(t('성공적으로 확정 되었습니다'))
}

// 저장
const saveDataH = () => {
  // console.log('11111')
  // console.log('searchParams 111 : ', searchParams )
  searchParams.HISTORY_YN = 'Y'
  // console.log('searchParams 222: ' , searchParams)
  let saveParams = []
  saveParams.push(searchParams)

  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_H_09', list: saveParams })
}

// 저장 후
const aftersaveDataH = () => {
  searchData()
  Message.success(t('성공적으로 확정 되었습니다'))
}

// 삭제
const deleteData = () => { 
  // console.log('searchParams 111 : ', searchParams )
  searchParams.HISTORY_YN = 'N'
  // console.log('searchParams 222: ' , searchParams)
  let saveParams = []
  saveParams.push(searchParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_DELETE_09', list: saveParams })
}

//삭제 후
const afterDelete = () => {
  searchData()
  Message.success(t('성공적으로 취소 되었습니다'))
}

const closePopup = () => {
  //searchSubData.value()
  // emit('after-search')
  emit("closed")
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  searchParams.HISTORY_YN = ''
  searchData()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="600"
  >
  <div class="title-bar">
    <span> 정기평가 위험성 산출 </span>
  </div>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :use-permission="false"
        :button-list="['btnCalculation','btnCancel', 'btnClose']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 인적사항 -->
    <v-card-text class="pa-2 pt-0 content-area" >
      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-text class="pa-0">
          <div class="d-flex my-2">
            <i-select
              :label="$t('산출 연도')"  
              v-model="searchParams.YEAR"
              width="180px"
              type="YEAR"
              margin="10px"
            />
          </div>
        </v-card-text>
      </v-card>
      <div class="d-flex flex-column fill-height">
      <v-sheet class="mt-2" height="300px">
        <IMenuTitle
          :title="$t('항목별 작성 상태')"
        />
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
        />
      </v-sheet>
      </div>
      <div class="d-flex flex-column fill-height">
      <v-sheet class="mt-2" height="300px">
        <IMenuTitle
          :title="$t('산출 이력')"
        />
        <RealGrid
          ref="grdSub"
          :grid-view-option="grdSubProps.gridViewOption"
          :keys="grdSubProps.keys"
          :fields="grdSubProps.fields"
          :columns="grdSubProps.columns"
          :column-layout="grdSubProps.columnLayout"
        />
        </v-sheet>
        </div>
        <!-- 팝업 -->
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
</style>