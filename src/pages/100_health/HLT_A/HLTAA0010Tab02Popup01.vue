<!--
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 위험도 산출기준(정량)(탭) > 추가(팝업)
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
  ID:'',
  CATEGORY: '', // 구분
  METHOD_TYPE: '', // 산출방법 구분
  UNIT_INFORMATION: '0', // 산출방법 단위정보
  METHOD_DETAILS: '', // 산출방법 산출세부
  ONE_POINT_F: '', // 1점
  ONE_SYMBOL_F: '',
  ONE_POINT_T: '',
  ONE_SYMBOL_T: '',
  TWO_POINT_F: '', // 2점
  TWO_SYMBOL_F: '',
  TWO_POINT_T: '',
  TWO_SYMBOL_T: '',
  THREE_POINT_F: '', // 3점
  THREE_SYMBOL_F: '',
  THREE_POINT_T: '',
  THREE_SYMBOL_T: '',
  FOUR_POINT_F: '', // 4점
  FOUR_SYMBOL_F: '',
  FOUR_POINT_T: '',
  FOUR_SYMBOL_T: '',
  FIVE_POINT_F: '', // 5점
  FIVE_SYMBOL_F: '',
  FIVE_POINT_T: '',
  FIVE_SYMBOL_T: '',
  REMARKS: '', // 비고
})

const codeList = reactive({
  // Category: [],
  CATEGORY:[
    { COD: 'A', TXT: '화학물질' },
    { COD: 'B', TXT: '소음' },
    { COD: 'C', TXT: '근골' },
  ],
  METHOD_TYPE:[
    { COD: 'A', TXT: '빈도' },
    { COD: 'B', TXT: '강도' },
  ],
  UNIT_INFORMATION:[
    { COD: '0', TXT: '없음' },
    { COD: '1', TXT: 'mg/㎥' },
    { COD: '2', TXT: 'Ppm' },
    { COD: '3', TXT: '발암성, 변이원성, 생식독성' },
    { COD: '4', TXT: 'dB(A)' },
  ],
  SYMBOL:[
    { COD: '', TXT: '선택' },
    { COD: '<', TXT: '미만(<)' },
    { COD: '>=', TXT: '이상(>=)' },
    { COD: '<=', TXT: '이하(<=)' },
    { COD: '>', TXT: '초과(>)' },
  ]
})

const openPopup = (parm) => {
  // console.log(parm.ID)
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
  // 구분
  if(searchParams.CATEGORY === '') {
    return Message.warn(t('구분을 선택해 주십시요.'))
  }
  // 산출방법 구분
  if(searchParams.METHOD_TYPE === '') {
    return Message.warn(t('산출방법(구분)을 선택해 주십시요.'))
  }
  // 산출방법 단위정보
  if(searchParams.UNIT_INFORMATION === '') {
    return Message.warn(t('산출방법(단위정보)를 선택해 주십시요.'))
  }
  // 산출방법 산출세부
  if(searchParams.METHOD_DETAILS === '') {
    return Message.warn(t('산출방법(산출세부)를 입력 하여 주십시요.'))
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  saveParams.push(searchParams)
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_02', list: saveParams })
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
  // console.log('searchParams : ' , searchParams)
  return commonSearchApi({ queryId: 'HLTAA0010_SEARCH_02', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  // console.log('res : ', res.ORESULT_CUR)
  searchParams.ID = res.ORESULT_CUR[0].ID,
  searchParams.CATEGORY =  res.ORESULT_CUR[0].CATEGORY, // 구분
  searchParams.METHOD_TYPE =  res.ORESULT_CUR[0].METHOD_TYPE, // 산출방법 구분
  searchParams.UNIT_INFORMATION =  res.ORESULT_CUR[0].UNIT_INFORMATION, // 산출방법 단위정보
  searchParams.METHOD_DETAILS =  res.ORESULT_CUR[0].METHOD_DETAILS, // 산출방법 산출세부
  searchParams.ONE_POINT_F =  res.ORESULT_CUR[0].ONE_POINT_F, // 1점
  searchParams.ONE_SYMBOL_F =  res.ORESULT_CUR[0].ONE_SYMBOL_F,
  searchParams.ONE_POINT_T =  res.ORESULT_CUR[0].ONE_POINT_T,
  searchParams.ONE_SYMBOL_T =  res.ORESULT_CUR[0].ONE_SYMBOL_T,
  searchParams.TWO_POINT_F =  res.ORESULT_CUR[0].TWO_POINT_F, // 2점
  searchParams.TWO_SYMBOL_F =  res.ORESULT_CUR[0].TWO_SYMBOL_F,
  searchParams.TWO_POINT_T =  res.ORESULT_CUR[0].TWO_POINT_T,
  searchParams.TWO_SYMBOL_T =  res.ORESULT_CUR[0].TWO_SYMBOL_T,
  searchParams.THREE_POINT_F =  res.ORESULT_CUR[0].THREE_POINT_F, // 3점
  searchParams.THREE_SYMBOL_F =  res.ORESULT_CUR[0].THREE_SYMBOL_F,
  searchParams.THREE_POINT_T =  res.ORESULT_CUR[0].THREE_POINT_T,
  searchParams.THREE_SYMBOL_T =  res.ORESULT_CUR[0].THREE_SYMBOL_T,
  searchParams.FOUR_POINT_F =  res.ORESULT_CUR[0].FOUR_POINT_F, // 4점
  searchParams.FOUR_SYMBOL_F =  res.ORESULT_CUR[0].FOUR_SYMBOL_F,
  searchParams.FOUR_POINT_T =  res.ORESULT_CUR[0].FOUR_POINT_T,
  searchParams.FOUR_SYMBOL_T =  res.ORESULT_CUR[0].FOUR_SYMBOL_T,
  searchParams.FIVE_POINT_F =  res.ORESULT_CUR[0].FIVE_POINT_F, // 5점
  searchParams.FIVE_SYMBOL_F =  res.ORESULT_CUR[0].FIVE_SYMBOL_F,
  searchParams.FIVE_POINT_T =  res.ORESULT_CUR[0].FIVE_POINT_T,
  searchParams.FIVE_SYMBOL_T =  res.ORESULT_CUR[0].FIVE_SYMBOL_T,
  searchParams.REMARKS =  res.ORESULT_CUR[0].REMARKS // 비고
}

/* ********** 닫기 ********** */
const closePopup = () => {
  searchParams.ID = '',
  searchParams.CATEGORY =  '', // 구분
  searchParams.METHOD_TYPE =  '', // 산출방법 구분
  searchParams.UNIT_INFORMATION =  '0', // 산출방법 단위정보
  searchParams.METHOD_DETAILS =  '', // 산출방법 산출세부
  searchParams.ONE_POINT_F =  '', // 1점
  searchParams.ONE_SYMBOL_F =  '',
  searchParams.ONE_POINT_T =  '',
  searchParams.ONE_SYMBOL_T =  '',
  searchParams.TWO_POINT_F =  '', // 2점
  searchParams.TWO_SYMBOL_F =  '',
  searchParams.TWO_POINT_T =  '',
  searchParams.TWO_SYMBOL_T =  '',
  searchParams.THREE_POINT_F =  '', // 3점
  searchParams.THREE_SYMBOL_F =  '',
  searchParams.THREE_POINT_T =  '',
  searchParams.THREE_SYMBOL_T =  '',
  searchParams.FOUR_POINT_F =  '', // 4점
  searchParams.FOUR_SYMBOL_F =  '',
  searchParams.FOUR_POINT_T =  '',
  searchParams.FOUR_SYMBOL_T =  '',
  searchParams.FIVE_POINT_F =  '', // 5점
  searchParams.FIVE_SYMBOL_F =  '',
  searchParams.FIVE_POINT_T =  '',
  searchParams.FIVE_SYMBOL_T =  '',
  searchParams.REMARKS =  '', // 비고
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
      <span>위험도 산출기준(정량) 수정/저장</span>
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
            <i-input
              v-model="searchParams.ID"
              style="display: none;"
            />
            <i-select
              :label="$t('기준년도')"  
              v-model="searchParams.YEAR"
              width="150px"
              type="YEAR"
            />
            <i-select
              v-model="searchParams.CATEGORY"
              :items="codeList.CATEGORY"
              :label="$t('구분')"
              label-width="50px" 
              width="180px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-select
              v-model="searchParams.METHOD_TYPE"
              :items="codeList.METHOD_TYPE"
              :label="$t('산출방법(구분)')"
              label-width="100px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.UNIT_INFORMATION"
              :items="codeList.UNIT_INFORMATION"
              :label="$t('산출방법(단위정보)')"
              label-width="120px" 
              width="300px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.METHOD_DETAILS"
              :label="$t('산출방법(산출세부)')"
              label-width="120px" 
              width="300px"
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.ONE_POINT_F"
              :label="$t('1점')"
              label-width="50px" 
              width="150px"
            />
            <i-select
              v-model="searchParams.ONE_SYMBOL_F"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.ONE_POINT_T"
              width="100px"
            />
            <i-select
              v-model="searchParams.ONE_SYMBOL_T"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.TWO_POINT_F"
              :label="$t('2점')"
              label-width="50px" 
              width="150px"
            />
            <i-select
              v-model="searchParams.TWO_SYMBOL_F"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.TWO_POINT_T"
              width="100px"
            />
            <i-select
              v-model="searchParams.TWO_SYMBOL_T"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.THREE_POINT_F"
              :label="$t('3점')"
              label-width="50px" 
              width="150px"
            />
            <i-select
              v-model="searchParams.THREE_SYMBOL_F"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.THREE_POINT_T"
              width="100px"
            />
            <i-select
              v-model="searchParams.THREE_SYMBOL_T"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.FOUR_POINT_F"
              :label="$t('4점')"
              label-width="50px" 
              width="150px"
            />
            <i-select
              v-model="searchParams.FOUR_SYMBOL_F"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.FOUR_POINT_T"
              width="100px"
            />
            <i-select
              v-model="searchParams.FOUR_SYMBOL_T"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.FIVE_POINT_F"
              :label="$t('5점')"
              label-width="50px" 
              width="150px"
            />
            <i-select
              v-model="searchParams.FIVE_SYMBOL_F"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.FIVE_POINT_T"
              width="100px"
            />
            <i-select
              v-model="searchParams.FIVE_SYMBOL_T"
              :items="codeList.SYMBOL"
              width="120px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.REMARKS"
              :label="$t('비고')"
              label-width="50px" 
              width="600px"
            />
          </div>
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
