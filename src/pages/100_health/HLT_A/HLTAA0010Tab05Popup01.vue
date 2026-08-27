<!--
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 위험성 보정기준 관리(탭) > 추가(팝업)
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['selectCas'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null) 



// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(new Date().getFullYear()),
  EVALUATION_FIELD:'', // 평가 분야
  DIVISION:'유소견', // 구분
  DISEASE_CD:'', // 질병 코드
  DISEASE_NM:'', // 질병 명칭

})

const codeList = reactive({
  // DIVISION: [],
  EVALUATION_FIELD:[
    { COD: '', TXT: '선택' },
    { COD: 'A', TXT: '화학물질' },
    { COD: 'B', TXT: '소음' },
    { COD: 'C', TXT: '근골' },
  ],
})

//그리드 속성셋팅
// const grdMainProps = reactive({
//   gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
//   keys: [],
//   fields: [
//     { fieldName: 'CASNO', width: '40', dataType: 'text', header: { text: t('CAS 번호') }, },
//     { fieldName: 'CASNM_KOR', width: '50', dataType: 'text', header: { text: t('물질명(국문)') }, },
//     { fieldName: 'CASNM_ENG', width: '80', dataType: 'text', header: { text: t('물질명(영문)') }, },
//     { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
//   ],
//   columns: [],
// })

// grdMainProps.columns = grdMainProps.fields

const openPopup = (parm) => {
  // console.log(parm.ID)
  // console.log(parm.YEAR)
  if (parm.ID === undefined || parm.ID === '') {
    // console.log('1111111111111111111')
  } else {
    searchParams.ID = parm.ID
    searchParams.YEAR = parm.YEAR
    onButtonsClick({ id: 'btnSearch' })
  }
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    // console.log('1111')
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  // 대분류
  if(searchParams.EVALUATION_FIELD === '') {
    return Message.warn(t('평가 분야를 선택해 주십시요.'))
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  saveParams.push(searchParams)
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_05', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  // onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAA0010_SEARCH_05', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  searchParams.ID = res.ORESULT_CUR[0].ID,
  searchParams.EVALUATION_FIELD = res.ORESULT_CUR[0].EVALUATION_FIELD,
  searchParams.DIVISION = res.ORESULT_CUR[0].DIVISION,
  searchParams.DISEASE_CD = res.ORESULT_CUR[0].DISEASE_CD,
  searchParams.DISEASE_NM = res.ORESULT_CUR[0].DISEASE_NM
}

/* ********** 닫기 ********** */
const closePopup = () => {
  searchParams.ID = '',
  searchParams.EVALUATION_FIELD = '',
  searchParams.DIVISION = '유소견',
  searchParams.DISEASE_CD = '',
  searchParams.DISEASE_NM = ''
  // grdMain.value.getDataProvider().setRows([])
  emit("closed")
  dialog.value = false
}

const onCellDblClicked = (grid, clickData) => {
  // let data = grdMain.value.getGridView().getSelectionData()[0]
  emit('selectCas', data)
  closePopup()
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="700"

    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>위험성 보정기준 수정/저장</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4 pb-2">
        <v-sheet class="searchArea d-flex flex-column">
          <div class="d-flex">
            <i-select
              :label="$t('기준년도')"  
              v-model="searchParams.YEAR"
              label-width="70px" 
              width="200px"
              type="YEAR"
            />
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.EVALUATION_FIELD"
              :items="codeList.EVALUATION_FIELD"
              :label="$t('평가 분야')"
              label-width="70px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.DIVISION"
              :label="$t('구분')"
              label-width="70px" 
              width="170px"
            />
            <i-input
              v-model="searchParams.DISEASE_CD"
              :label="$t('질병코드')"
              label-width="70px" 
              width="170px"
            />
            <i-input
              :label="$t('명칭')"
              v-model="searchParams.DISEASE_NM"
              label-width="70px" 
              width="250px"
            />
          </div>
          <!-- <div class="d-flex">
            <i-input
              v-model="searchParams.BIGO"
              :label="$t('관리 방안')"
              label-width="70px" 
              width="500px"
            />
          </div> -->
        </v-sheet>
      </div>
      <!-- <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('CAS 목록')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div> -->
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
