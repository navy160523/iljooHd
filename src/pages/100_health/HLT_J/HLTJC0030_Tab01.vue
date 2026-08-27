<!-- 
  화면명 : 업무상질병 발생건수
  화면개요 : 업무상질병 발생건수
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, getCompanyList } from '@hiway/api/commonApi'
import ILabel from "@/components/ILabel.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { useCommonStore } from '@hiway/stores/common'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()
const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
// 조회조건
const searchParams = reactive({
  DIV: 'Y',
  YEAR_FROM: Number(dayjs().get('year')) - 5,
  YEAR_TO: dayjs().get('year'),
  MONTH_FROM: 1,
  MONTH_TO: 12,
})

const codeList = reactive({
  DIV: [
    { COD: 'Y', TXT: '년도' },
    { COD: 'M', TXT: '월' },
  ],
  BSNS_TYPE: [
    { COD: '0', TXT: '전체' },
    { COD: 'A', TXT: '조선' },
    { COD: 'B', TXT: '해양' },
    { COD: 'C', TXT: '엔진' },
    { COD: 'D', TXT: '특수선' },
    { COD: 'E', TXT: '기타' },
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }
  grdMain.value.setBindingColumn('BSNS_TYPE', codeList.BSNS_TYPE, 'COD', 'TXT')
  getData()
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, rowIndicator: { visible: false },},
  keys : ['YEAR', 'BSNS_TYPE'], 
  fields : [ 
    { fieldName: 'YEAR', width: '50', dataType: 'text', header: { text: t('년도') }, mergeRule: { criteria: 'value' } }, // no과 이름이 같아서 이상하다고 함
    { fieldName: 'BSNS_TYPE', width: '50', dataType: 'text', header: { text: t('사업부') }, lookupDisplay: true },
    { fieldName: 'WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('신청') } },
    { fieldName: 'RESULT_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('판정') } },
    { fieldName: 'OK_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인') } },
    { fieldName: 'RATIO', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인율') } },
    { fieldName: 'EAR_WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('신청') }, },
    { fieldName: 'EAR_RESULT_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('판정') } },
    { fieldName: 'EAR_OK_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인') }, },
    { fieldName: 'EAR_RATIO', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인율') } },
    { fieldName: 'BONE_WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('신청') }, },
    { fieldName: 'BONE_RESULT_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('판정') } },
    { fieldName: 'BONE_OK_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인') }, },
    { fieldName: 'BONE_RATIO', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인율') } },
    { fieldName: 'BREATH_WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('신청') }, },
    { fieldName: 'BREATH_RESULT_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('판정') } },
    { fieldName: 'BREATH_OK_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인') }, },
    { fieldName: 'BREATH_RATIO', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인율') } },
    { fieldName: 'ETC_WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('신청') }, },
    { fieldName: 'ETC_RESULT_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('판정') } },
    { fieldName: 'ETC_OK_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인') }, },
    { fieldName: 'ETC_RATIO', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('승인율') } },

    // 안보이는거
  ],
  columnLayout: [
    'YEAR',
    'BSNS_TYPE',
    {
      name: '전체',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'WHOLE_CNT', 'RESULT_CNT', 'OK_CNT', 'RATIO' ],
      header: { text: t('전체') },
    },
    { 
      name: '소음성 난청',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'EAR_WHOLE_CNT', 'EAR_RESULT_CNT', 'EAR_OK_CNT', 'EAR_RATIO' ],
      header: { text: t('소음성 난청') },
    },
    { 
      name: '근골격계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'BONE_WHOLE_CNT', 'BONE_RESULT_CNT', 'BONE_OK_CNT', 'BONE_RATIO' ],
      header: { text: t('근골격계') },
    },
    { 
      name: '호흡기계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'BREATH_WHOLE_CNT', 'BREATH_RESULT_CNT', 'BREATH_OK_CNT', 'BREATH_RATIO' ],
      header: { text: t('호흡기계') },
    },
    { 
      name: '기타',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'ETC_WHOLE_CNT', 'ETC_RESULT_CNT', 'ETC_OK_CNT', 'ETC_RATIO' ],
      header: { text: t('기타') },
    },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }

  if (btn.id === 'btnSearch') {
    getData()
  } 
}

// 그리드 데이터 조회
const getData = () => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }
  
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTJC0030_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  if(searchParams.DIV == 'Y') {
    grdMain.value.getGridView().setColumnProperty('YEAR' , 'header', { text: t('년도') })
  } else {
    grdMain.value.getGridView().setColumnProperty('YEAR' , 'header', { text: t('월') })
  }
  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ background: '#f5f8fb' } }
    if(grid.getValue(item.index, 'BSNS_TYPE') == '0') {
      ret.style = { background: '#e9f0f5' }
    }
    return ret
  })
}

watch(() => searchParams.YEAR_FROM, (newValue, oldValue) => {
  if(searchParams.DIV == 'M') return
  if(searchParams.YEAR_FROM > searchParams.YEAR_TO) {
    nextTick(() => {
      searchParams.YEAR_FROM = searchParams.YEAR_TO
    })
  }
})

watch(() => searchParams.YEAR_TO, (newValue, oldValue) => {
  if(searchParams.DIV == 'M') return
  if(searchParams.YEAR_TO < searchParams.YEAR_FROM) {
    nextTick(() => {
      searchParams.YEAR_TO = searchParams.YEAR_FROM
    })
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="t('업무상질병 발생건수')"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <ILabel :label="$t('검색구분')"/>
          <div style="width:170px; align-self: center;">
            <VRadioGroup
              v-model="searchParams.DIV"
              class="mt-auto pl-3 pr-3 radio"
              width="300px"
              inline
            >
              <VRadio
                v-for="(item, i) in codeList.DIV"
                :key="i"
                :value="item.COD"
                :label="item.TXT"
              />
            </VRadioGroup>
          </div>
          <div v-if="searchParams.DIV == 'Y'" class="d-flex"> 
            <i-input
              v-model="searchParams.YEAR_FROM"
              :label="$t('년도')"
              label-width="50px"
              type="Number"
              width="200px"
            />
            <i-input
              v-model="searchParams.YEAR_TO"
              :label="$t('~')"
              label-width="10px"
              type="Number"
              width="160px"
            />
          </div>
          <div v-if="searchParams.DIV == 'M'" class="d-flex"> 
            <i-input
              v-model="searchParams.YEAR_TO"
              :label="$t('년도')"
              label-width="50px"
              type="Number"
              width="200px"
            />
            <i-input
              class="ml-2"
              v-model="searchParams.MONTH_FROM"
              :label="$t('월')"
              label-width="30px"
              type="Number"
              width="180px"
              :min="1"
              :max="searchParams.MONTH_TO"
            />
            <i-input
              v-model="searchParams.MONTH_TO"
              :label="$t('~')"
              label-width="10px"
              type="Number"
              width="160px"
              :min="searchParams.MONTH_FROM"
              :max="12"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 50px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>