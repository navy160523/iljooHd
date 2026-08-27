<!-- HLTAB0040 평가결과 다국어 번역관리 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  chatbotTranslateLn,
  commonRequest
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useCommonStore } from '@hiway/stores/common'

defineOptions({
  name: '100_health-HLT_A-HLTAB0040',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: '',
  DEPT_NM: '',
  // DEPT_CD: userStore.deptCd,
  // DEPT_NM: userStore.deptNm,
  ASGN_CD: '',
  language: 'en',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  COMBO_DEPT_CD: [],
  ASGN_CD: [],
  COMBO_ASGN_CD: [],
  language: [
    { COD: 'en', TXT: '영어' },
    { COD: 'vi', TXT: '베트남어' },
    { COD: 'uz', TXT: '우즈베크어' },
    { COD: 'mn', TXT: '몽골어' },
    { COD: 'si', TXT: '싱할라어' },
    { COD: 'th', TXT: '태국어' },
    { COD: 'ru', TXT: '러시아어' },
    { COD: 'ja', TXT: '일본어' },
    { COD: 'zh', TXT: '중국어간체' },
    { COD: 'zh-TW', TXT: '중국어번체' },
    { COD: 'de', TXT: '독일어' },
    { COD: 'fr', TXT: '프랑스어' },
    { COD: 'ar', TXT: '아랍어' },
    { COD: 'id', TXT: '인도네시아어' },
    { COD: 'ne', TXT: '네팔어' },
    { COD: 'bn', TXT: '벵골어' },
    { COD: 'fil', TXT: '필리핀어' },
    { COD: 'hi', TXT: '힌디어' },
    { COD: 'kk', TXT: '카자흐어' },
    { COD: 'km', TXT: '크메르어' },
    { COD: 'ky', TXT: '키르기스어' },
    { COD: 'my', TXT: '미얀마(버마)어' },
    { COD: 'tr', TXT: '터키어' },
    { COD: 'tk', TXT: '투르크멘어' },
    { COD: 'uk', TXT: '우크라이나어' },
    { COD: 'ur', TXT: '우르드어' },
  ],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),

    // 사업부 [1]
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: 'N',
      },
    }),
    // 부서[2]
    commonSearchApi({
      queryId: 'HLTAB0010_SEARCH_ASGN',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: '',
        USE_DIV: 'Y',
      },
    }),
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    codeList.ASGN_CD = res[2].ORESULT_CUR.filter(item => item.ORGN_DIV == 'B')
    codeList.ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })

    codeList.COMBO_DEPT_CD = codeList.DEPT_CD.filter(item => item.BSNS_CD == searchParams.BSNS_CD)
    codeList.COMBO_ASGN_CD = codeList.ASGN_CD.filter(item => item.DEPT_CD == searchParams.DEPT_CD)
  })
}

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: ['WORK_STANDARD_ID'],
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '170',
      styleName: 'left-column',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '160',
      styleName: 'left-column',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '120',
      styleName: 'left-column',
      editable: false,
      header: { text: t('협력사') },
    },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '120', editable: false, header: { text: t('제/개정일자') } },
    { fieldName: 'TRANS_DT', dataType: 'text', width: '120', editable: false, header: { text: t('번역일자') } },
    { fieldName: 'EN_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('영어') } },
    { fieldName: 'VI_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('베트남어') } },
    { fieldName: 'UZ_TRANS', dataType: 'text', width: '80', editable: false, header: { text: t('우즈베크어') } },
    { fieldName: 'MN_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('몽골어') } },
    { fieldName: 'SI_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('싱할라어') } },
    { fieldName: 'TH_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('태국어') } },
    { fieldName: 'RU_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('러시아어') } },
    { fieldName: 'JA_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('일어') } },
    { fieldName: 'ZH_TRANS', dataType: 'text', width: '80', editable: false, header: { text: t('중국어 간체') } },
    { fieldName: 'ZH_TW_TRANS', dataType: 'text', width: '80', editable: false, header: { text: t('중국어 번체') } },
    { fieldName: 'DE_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('독일어') } },
    { fieldName: 'FR_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('프랑스어') } },
    { fieldName: 'AR_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('아랍어') } },
    { fieldName: 'ID_TRANS', dataType: 'text', width: '90', editable: false, header: { text: t('인도네시아어') } },
    { fieldName: 'NE_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('네팔어') } },

    { fieldName: 'BN_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('벵골어') } },
    { fieldName: 'FIL_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('필리핀어') } },
    { fieldName: 'HI_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('힌두어') } },
    { fieldName: 'KK_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('카자흐어') } },
    { fieldName: 'KM_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('크메르어') } },
    { fieldName: 'KY_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('키르기스어') } },
    { fieldName: 'MY_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('미얀마(버마)어') } },
    { fieldName: 'TR_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('터키어') } },
    { fieldName: 'TK_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('투르크맨어') } },
    { fieldName: 'UK_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('우크라이나어') } },
    { fieldName: 'UR_TRANS', dataType: 'text', width: '70', editable: false, header: { text: t('우르드어') } },
    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'RPA_WORK', dataType: 'text', visible: false },
    { fieldName: 'PROGRESS_STATUS', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnTrans') {
    // let param = {
    //   sLang: 'en', //번역할언어
    //   sText: '컴퓨터', //번역할말
    // } ->컴퓨터라는 단어를 영어로 번역하겠다 라는 의미

    // let param = {
    //   sLang: 'en', //번역할언어
    //   sText: '컴퓨터', //번역할말
    // }
    // chatbotTranslateLn(param).then((res) => {
    //   console.log('응답값?', res)
    // })

    saveData()
  } else if (btn.id === 'btnUpdate') {
    vm.$swal({ 
      title: t('시작한다?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonRequest("/hse/health/HLTAB0040_TEST_TRANS_01", { queryId: "HLTAB0040_TEST_TRANS_01", list: [searchParams] }).then(res => {
          Message.success(t('성공!!!!'))
          getData()
        })
      }
    })
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0040_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellDblClicked = (grid, clickData) => {}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    searchParams.language = typeof searchParams.language === 'string' ? [searchParams.language] : searchParams.language
    for (let lang of searchParams.language) {
      let newArr = {
        CMPNY_DIV: data.CMPNY_DIV,
        BSNS_CD: data.BSNS_CD,
        DEPT_CD: data.DEPT_CD,
        ASGN_CD: data.DEPT_CD == data.ASGN_CD ? '': data.ASGN_CD,
        YEAR: data.YEAR,
        SEQ: data.SEQ,
        LANGUAGE: lang
      }
      saveParams.push(newArr)
    }
  }

  
  vm.$swal({ 
    title: t('번역 작업 접수하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'HLTAB0040_SAVE_01', 
        list: saveParams
      }).then(res1 => {
        if (res1.result.status === '200') {
          commonExecuteApi({
            queryId : 'HLTAB0040_SAVE_02', 
            list: saveParams
          }).then(res2 => {
            if (res2.result.status === '200') {
              Message.success(t('번역작업이 접수되었습니다. 번역 작업은 1일 소요 됩니다.'))
              onButtonsClick({ id: 'btnSearch' })
            }
          })
        }
      })
    }
  })
}

// 사업부 변경 시 부서 변경 이벤트
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    searchParams.ASGN_CD = ''
    searchParams.DEPT_CD = ''
    codeList.COMBO_DEPT_CD = codeList.DEPT_CD.filter(item => item.BSNS_CD == newValue)
  }
)

// 부서가 바뀌면 협력사 데이터 가져옴
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    searchParams.ASGN_CD = ''
    codeList.COMBO_ASGN_CD = codeList.ASGN_CD.filter(item => item.DEPT_CD == newValue)
    codeList.COMBO_ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })
  }
)

onMounted(() => {
  searchParams.DEPT_CD = userStore.deptCd
  searchParams.DEPT_NM = userStore.deptNm
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnTrans']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('회사')"
              label-width="50px"
              width="200px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              label-width="50px"
              width="200px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <i-select
              :label="$t('부서')"
              label-width="50px"
              width="200px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.COMBO_DEPT_CD"
              item-value="DEPT_CD"
              item-title="ASGN_NM"
            />
            <i-select
              :label="$t('협력사')"
              label-width="50px"
              width="200px"
              v-model="searchParams.ASGN_CD"
              :items="codeList.COMBO_ASGN_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :readonly="isEmpty(searchParams.DEPT_CD)"
            />
            <i-select
              :label="$t('언어')"
              label-width="50px"
              width="200px"
              v-model="searchParams.language"
              :items="codeList.language"
              item-value="COD"
              item-title="TXT"
              multiple
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
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
    min-height: 700px;
  }
}
.v-autocomplete__selection {
  flex-wrap: nowrap;
}
::v-deep(.v-field__input) {
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  overflow: hidden !important;
}
</style>
