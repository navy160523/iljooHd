<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'

defineOptions({
  name:'80_operation-OPR_A-OPRAD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

const codeList = reactive({
  BSNSList: [
    { BSNS_CD: '' ,BSNS_NM: '전체' },
  ],
  JBGBNList: [],

  // RadioGroup set
  USER_DIVList: [
    { TXT: '전체', COD: '' },
    { TXT: '직영', COD: 'A' },
    { TXT: '협력사', COD: 'B' },
  ],
  PROD_DIVList: [
    { TXT: '전체', COD: 'A' },
    { TXT: '생산', COD: 'Y' },
    { TXT: '비생산', COD: 'N' },
  ],

  // Checkbox set
  RES_CDList: [
    { TXT: '부서장/팀장', COD: '1' , selectYn: 'Y' },
    { TXT: '직책과장', COD: '2' , selectYn: 'Y' },
    { TXT: '운영과장', COD: '3' , selectYn: 'Y' },
    { TXT: '안전추진자', COD: '4' , selectYn: 'Y' },
    { TXT: '서무', COD: '5' , selectYn: 'Y' },
    { TXT: '협력사', COD: '6' , selectYn: 'Y' },
    { TXT: '담당임원', COD: '7' , selectYn: 'Y' },
    { TXT: 'Safe 클로버', COD: '8' , selectYn: 'Y' },
    { TXT: '전체 선택', COD: '9' , selectYn: 'Y' },
  ],
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  USER_DIV : 'A',     // 협력사 구분 ( '': 전체, 'A': 직영, 'B': 협력사 )
  PROD_DIV : 'A',    // 생산/비생산 구분 ( 'A': 전체, 'Y': 생산, 'N': 비생산 )

  // 업무구분
  RES_CD1: '1',
  RES_CD2: '2',
  RES_CD3: '3',
  RES_CD4: '4',
  RES_CD5: '5',
  RES_CD6: '6',
  RES_CD7: '7',
  RES_CD8: '8',
})

//코드리스트 셋팅
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ commonSearchApi({ queryId : 'searchBSNS', param }) ]).then(res => {
    res[0].ORESULT_CUR.forEach( value => {
      codeList.BSNSList.push(value) 
    })

    grdMain.value.setBindingColumn("BSNS_CD", codeList.BSNSList, "BSNS_CD", "BSNS_NM")   // 사업부 lookup set
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, header: { height: 60 } },
  keys : ['EMP_NO'],
  fields : [ 
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column',
      lookupDisplay: true, mergeRule: { "criteria": "value" }, editable: false },
    { fieldName: 'ASGN_CD', dataType: 'text', width: '70', header: { text: t('코드') }, editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', width: '200', header: { text: t('소속명') }, editable: false, styleName: 'left-column' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false, styleName: 'left-column' },
    { fieldName: 'KOR_NM', dataType: 'text', width: '70', header: { text: t('성명') }, editable: false, styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false, styleName: 'left-column' },
    { fieldName: 'RES_NM', dataType: 'text', header: { text: t('구분') }, editable: false, styleName: 'left-column' },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내전화') }, editable: false, styleName: 'left-column' },
    { fieldName: 'EMAIL', dataType: 'text', header: { text: t('메일주소') }, editable: false, styleName: 'left-column' },
  ],
  columns : [],
  columnLayout: [
    'BSNS_CD',
    {
      name: '소속',
      direction: 'horizontal',
      items: [ 'ASGN_CD', 'ASGN_NM' ],
      header: { text: t('소속') },
    },
    'EMP_NO', 'KOR_NM', 'JOB_TIT_NM', 'RES_NM', 'TEL_NO', 'EMAIL',
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  const RES_CD = codeList.RES_CDList

  RES_CD.forEach( (val ,idx) => {
    if(val.selectYn === 'N'){
      searchParams['RES_CD' + (idx + 1)] = null
    } else {
      searchParams['RES_CD' + (idx + 1)] = idx + 1
    }
  })
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
}

const searchData = idx => {
  return commonSearchApi({ queryId : 'OPRAD0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const allCheck = item => {
  console.log(" item : " , item)
  if(item.COD === '9' && item.selectYn === 'Y'){
    codeList.RES_CDList.forEach(e => {
      e.selectYn = 'Y'
    })
  } else if(item.COD === '9' && item.selectYn === 'N'){
    codeList.RES_CDList.forEach(e => {
      e.selectYn = 'N'
    })
  }
}

const resetGrid = e => {
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">  
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-wrap">
          <i-select
            :label="$t('사업부')"
            labelWidth="60px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNSList"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:modelValue="resetGrid"
            width="300px"
          />

          <div class="d-flex align-center">
            <div class="formLabelText mr-5">
              {{ $t('조직구분') }}
            </div>
            <VRadioGroup
                v-model="searchParams.USER_DIV"
                inline
                @change="resetGrid"
              >
                <VRadio
                  v-for="(item , i) in codeList.USER_DIVList"
                  :key="i"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </VRadioGroup>
          </div>
          <div class="d-flex align-center pl-8 pr-8">
            <div class="formLabelText mr-5">
              {{ $t('생산/비생산') }}
            </div>
            <VRadioGroup
              v-model="searchParams.PROD_DIV"
              inline
              @change="resetGrid"
            >
              <VRadio
                v-for="(item , i) in codeList.PROD_DIVList"
                :key="i"
                :value="item.COD"
                :label="item.TXT" 
              />
            </VRadioGroup>
          </div>
          <div class="d-flex align-center mt-1">
            <div class="formLabelText mr-5">
              {{ $t('업무구분') }}
            </div>
            <div
              v-for="(item, i) in codeList.RES_CDList"
              :key="i"
              cols="auto"
              class="pr-4"
            >
              <VCheckbox 
                :label="item.TXT"
                v-model="item.selectYn"
                @change="allCheck(item)"
              />
            </div>
          </div>
        </v-sheet>

      <!-- 메인그리드 -->
      <v-sheet class="h-auto">
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
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>