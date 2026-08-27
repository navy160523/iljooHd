<!--
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 위험도 산출기준(정성)(탭) > 추가(팝업)
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted, watch } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import { isEmpty } from 'lodash-es'

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
  CATEGORY_MA: '', // 대분류
  CATEGORY_ME:'',  // 중분류
  CATEGORY_SU:'', // 소분류
  COD:'', // 코드
  CATEGORY_1:'', // 카테고리1 텍스트(저장용)
  CATEGORY_2:'', // 카테고리2 텍스트(저장용)
  CATEGORY_1_COD: '', // 카테고리1 코드
  CATEGORY_2_COD: '', // 카테고리2 코드
  POINT:'', // 배점
  REMARKS:'', // 비고
})

const codeList = reactive({
  // Category: [],
  CATEGORY_MA:[
    { COD: '', TXT: '선택' },
    { COD: 'A', TXT: '화학물질' },
    { COD: 'B', TXT: '소음' },
    { COD: 'C', TXT: '근골' },
  ],
  CATEGORY_ME:[
    { COD: '', TXT: '선택' },
    { COD: 'A', TXT: '빈도' },
    { COD: 'B', TXT: '강도' },
  ],
  CATEGORY_SU:[
    { COD: '', TXT: '선택' },
    { COD: 'A', TXT: '배점인자' },
    { COD: 'B', TXT: '보정인자' },
  ],
  CATEGORY_1:[],
  CATEGORY_2:[],
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
  if(searchParams.CATEGORY_MA === '') {
    return Message.warn(t('대분류를 선택해 주십시요.'))
  }
  // 중분류
  if(searchParams.CATEGORY_ME === '') {
    return Message.warn(t('중분류를 선택해 주십시요.'))
  }
  // 소분류
  if(searchParams.CATEGORY_SU === '') {
    return Message.warn(t('소분류를 선택해 주십시요.'))
  }

  // DB에는 코드 텍스트를 저장해야함
  if(!isEmpty(searchParams.CATEGORY_1_COD)) {
    searchParams.CATEGORY_1 = codeList.CATEGORY_1.filter(item => item.COD === searchParams.CATEGORY_1_COD)[0].TXT
  }else {
    searchParams.CATEGORY_1 = ''
  }
  // 카테고리 2 없을시 카테고리 1 과 동일한 값이 들어가도록
  if(!isEmpty(searchParams.CATEGORY_2_COD)) {
    searchParams.CATEGORY_2 = codeList.CATEGORY_2.filter(item => item.COD === searchParams.CATEGORY_2_COD)[0].TXT
  }else {
    searchParams.CATEGORY_2 = searchParams.CATEGORY_1
  }
  // CATEGORY_MA || CATEGORY_ME || CATEGORY_SU || CATEGORY_1 그룹 || CATEGORY_2 그룹 으로 만들어야함
  searchParams.COD = [
    searchParams.CATEGORY_MA, 
    searchParams.CATEGORY_ME, 
    searchParams.CATEGORY_SU, 
    searchParams.CATEGORY_1_COD,
    searchParams.CATEGORY_2_COD,
  ].join('')

  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  saveParams.push(searchParams)
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_03', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  // onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAA0010_SEARCH_03', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  searchParams.ID = res.ORESULT_CUR[0].ID,
  searchParams.CATEGORY_MA = res.ORESULT_CUR[0].CATEGORY_MA // 대분류
  searchParams.CATEGORY_ME = res.ORESULT_CUR[0].CATEGORY_ME // 중분류
  searchParams.CATEGORY_SU = res.ORESULT_CUR[0].CATEGORY_SU // 소분류
  searchParams.CATEGORY_1 = res.ORESULT_CUR[0].CATEGORY_1   // 카테고리1
  searchParams.CATEGORY_2 = res.ORESULT_CUR[0].CATEGORY_2   // 카테고리2
  searchParams.CATEGORY_1_COD = res.ORESULT_CUR[0].COD[3]   // 카테고리1 코드 (COD 에서 4번째 코드)
  searchParams.CATEGORY_2_COD = res.ORESULT_CUR[0].COD[4]   // 카테고리1 코드 (COD 에서 5번째 코드)
  searchParams.POINT = res.ORESULT_CUR[0].POINT, // 배점
  searchParams.REMARKS = res.ORESULT_CUR[0].REMARKS // 비고
}

/* ********** 닫기 ********** */
const closePopup = () => {
  searchParams.ID = '',
  searchParams.CATEGORY_MA = '', // 대분류
  searchParams.CATEGORY_ME = '',  // 중분류
  searchParams.CATEGORY_SU = '', // 소분류
  searchParams.COD = '' // 코드
  searchParams.CATEGORY_1 = '', // 카테고리1
  searchParams.CATEGORY_1_COD = '' // 카테고리1 코드
  searchParams.CATEGORY_2 = '', // 카테고리2
  searchParams.CATEGORY_2_COD = '' // 카테고리2 코드
  searchParams.POINT = '', // 배점
  searchParams.REMARKS = '', // 비고
  codeList.CATEGORY_1 = []
  codeList.CATEGORY_2 = []
  emit("closed")
  dialog.value = false
}

const onCellDblClicked = (grid, clickData) => {
  // let data = grdMain.value.getGridView().getSelectionData()[0]
  emit('selectCas', data)
  closePopup()
}

/* WATCH 이벤트 */
// 대/중/소 분류 > 카테고리 1 목록 불러오기
watch(() => [searchParams.CATEGORY_MA, searchParams.CATEGORY_ME, searchParams.CATEGORY_SU], (newValue, oldValue) => {  
  codeList.CATEGORY_1 = []
  if(!isEmpty(searchParams.CATEGORY_MA) && !isEmpty(searchParams.CATEGORY_ME) && !isEmpty(searchParams.CATEGORY_SU)) {
    getCodeList('HHIIA10001'+newValue.join('')).then((res) => {
      codeList.CATEGORY_1 = res.ORESULT_CUR
      // searchParams.CATEGORY_1_COD = 
    })
  }
})

// 카테고리1 > 카테고리2 목록 불러오기
watch(() => searchParams.CATEGORY_1_COD, (newValue, oldValue) => {
  codeList.CATEGORY_2 = []
  if(!isEmpty(searchParams.CATEGORY_1_COD)) {
    let ALL_UP_CD = [searchParams.CATEGORY_MA, searchParams.CATEGORY_ME, searchParams.CATEGORY_SU, newValue].join('')
    getCodeList('HHIIA10001'+ALL_UP_CD).then((res) => {
      codeList.CATEGORY_2 = res.ORESULT_CUR
    })
  }
})

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
      <span>위험도 산출기준(정성) 수정/저장</span>
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
              label-width="60px" 
              width="200px"
              type="YEAR"
            />
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.CATEGORY_MA"
              :items="codeList.CATEGORY_MA"
              :label="$t('대분류')"
              label-width="60px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-select
              v-model="searchParams.CATEGORY_ME"
              :items="codeList.CATEGORY_ME"
              :label="$t('중분류')"
              label-width="60px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-select
            v-model="searchParams.CATEGORY_SU"
              :items="codeList.CATEGORY_SU"
              :label="$t('소분류')"
              label-width="60px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
          </div>
          <div class="d-flex">
            <!-- <i-input
              v-model="searchParams.CATEGORY_1"
              :label="$t('카테고리1')"
              label-width="60px" 
              width="250px"
            /> -->
            <i-select
              v-model="searchParams.CATEGORY_1_COD"
              :items="codeList.CATEGORY_1"
              :label="$t('카테고리1')"
              label-width="60px" 
              item-value="COD"
              item-title="TXT"
              :readonly="isEmpty(searchParams.CATEGORY_MA) || isEmpty(searchParams.CATEGORY_ME) || isEmpty(searchParams.CATEGORY_SU)"
            />
            <!-- <i-input
              v-model="searchParams.CATEGORY_2"
              :label="$t('카테고리2')"
              label-width="60px" 
              width="250px"
            /> -->            
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.CATEGORY_2_COD"
              :items="codeList.CATEGORY_2"
              :label="$t('카테고리2')"
              label-width="60px" 
              item-value="COD"
              item-title="TXT" 
              :readonly="isEmpty(searchParams.CATEGORY_1_COD)"
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.POINT"
              :label="$t('배점')"
              label-width="60px" 
              width="120px"
            />
            <i-input
              v-model="searchParams.REMARKS"
              :label="$t('비고')"
              label-width="60px" 
              width="500px"
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
