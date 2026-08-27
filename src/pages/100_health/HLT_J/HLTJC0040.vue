<!-- 
  화면명 : 직업병 통계
  화면개요 : 직업병 통계
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
import Popup01 from '@/pages/100_health/HLT_J/HLTJC0030_Popup01.vue'

defineOptions({
  name: '100_health-HLT_J-HLTJC0040',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()
const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const popup01 = ref(null)

// 조회조건
const searchParams = reactive({
  YEAR_FROM: Number(dayjs().get('year')) - 5,
  YEAR_TO: dayjs().get('year'),
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }
  getData()
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, rowIndicator: { visible: false },},
  keys : ['YEAR'], 
  fields : [ 
    { fieldName: 'YEAR', width: '70', dataType: 'text', header: { text: t('연도') }, mergeRule: { criteria: 'value' } }, // no과 이름이 같아서 이상하다고 함
    { fieldName: 'WORKER_CNT', width: '50', dataType: 'text', header: { text: t('근로자수') }, },
    { fieldName: 'YO_WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') } },
    { fieldName: 'WHOLE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_EAR_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') } },
    { fieldName: 'EAR_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BONE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BONE_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BREATH_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BREATH_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BREATH1_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BREATH1_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BREATH2_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BREATH2_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BREATH3_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BREATH3_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BREATH4_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BREATH4_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BREATH5_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BREATH5_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BLOOD_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') }, },
    { fieldName: 'BLOOD_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BRAIN_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') } },
    { fieldName: 'BRAIN_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_SKIN_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') } },
    { fieldName: 'SKIN_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_BIBRATION_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') } },
    { fieldName: 'BIBRATION_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },
    { fieldName: 'YO_ETC_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('유소견') } },
    { fieldName: 'ETC_CNT', width: '50', dataType: 'text', styleName: 'right-column', header: { text: t('질병') } },

    // 안보이는거
  ],
  columnLayout: [
    'YEAR',
    'WORKER_CNT',
    {
      name: '전체',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_WHOLE_CNT', 'WHOLE_CNT' ],
      header: { text: t('전체') },
    },
    { 
      name: '소음성 난청',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_EAR_CNT', 'EAR_CNT'],
      header: { text: t('소음성 난청') },
    },
    { 
      name: '근골격계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_BONE_CNT', 'BONE_CNT' ],
      header: { text: t('근골격계') },
    },
    { 
      name: '호흡기계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 
        { 
          name: '소계',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'YO_BREATH_CNT', 'BREATH_CNT' ],
          header: { text: t('소계') },
        },
        { 
          name: '폐암',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'YO_BREATH1_CNT', 'BREATH1_CNT' ],
          header: { text: t('폐암') },
        },  
        { 
          name: '만성폐쇄성\n폐질환',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'YO_BREATH2_CNT', 'BREATH2_CNT' ],
          header: { text: t('만성폐쇄성\n폐질환') },
        },  
        { 
          name: '진폐증',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'YO_BREATH3_CNT', 'BREATH3_CNT' ],
          header: { text: t('진폐증') },
        },  
        { 
          name: '중피증,\n석면폐증',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'YO_BREATH4_CNT', 'BREATH4_CNT' ],
          header: { text: t('중피증,\n석면폐증') },
        },
        { 
          name: '기타 호흡기\n질환',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'YO_BREATH5_CNT', 'BREATH5_CNT' ],
          header: { text: t('기타 호흡기\n질환') },
        },  
      ],
      header: { text: t('호흡기계') },
    },
    { 
      name: '조혈기계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_BLOOD_CNT', 'BLOOD_CNT' ],
      header: { text: t('조혈기계') },
    },
    { 
      name: '뇌심혈관계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_BRAIN_CNT', 'BRAIN_CNT' ],
      header: { text: t('뇌심혈관계') },
    },
    { 
      name: '피부계',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_SKIN_CNT', 'SKIN_CNT' ],
      header: { text: t('피부계') },
    },
    { 
      name: '진동',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_BIBRATION_CNT', 'BIBRATION_CNT' ],
      header: { text: t('진동') },
    },
    { 
      name: '기타',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'YO_ETC_CNT', 'ETC_CNT' ],
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
  } else if (btn.id === 'btnWorkerCnt') {
    popup01.value.openPopup()
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
  return commonSearchApi({ queryId: 'HLTJC0040_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ background: '#f5f8fb' } }
    if(isNaN(grid.getValue(item.index, 'YEAR'))) {
      ret.style = { background: '#e9f0f5' }
    }
    return ret
  })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnWorkerCnt']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <div class="d-flex"> 
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
      <Popup01 ref="popup01" @after-search="onButtonsClick({ id:'btnSearch' })"/>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
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
    min-height: 400px;
  }
}
</style>