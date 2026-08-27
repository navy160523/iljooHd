<!-- 
  화면명 : 건강진단 인사DB 대상자 조회
  화면개요 : 인사DB 대상자 조회
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonLogExecuteApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_G-HLTGA0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams =reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HLD_OFFI_GBN: '',
  USER_ID: '',
  IP_ADDRESS: '',
  HLD_GBN_1: '1',
  HLD_GBN_2: '2',
  HLD_GBN_3: '',
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }

  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields : [ 

    { fieldName: 'JOB_GRP_NM', width: '120', dataType: 'text', header: { text: t('직계') } },
    { fieldName: 'DUTY_FAMILY_NM', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('직렬') }, lookupDisplay: true },
    { fieldName: 'DUTY_FNC_NM', width: '120', styleName: 'left-column', dataType: 'text', header: { text: t('표준직무') } },
    { fieldName: 'DUTY_NM', width: '220', styleName: 'left-column', dataType: 'text', header: { text: t('직무') } },
    { fieldName: 'DEPTNM', width: '150', styleName: 'left-column', dataType: 'text', header: { text: t('부서명') } },
    { fieldName: 'ASGNNM', width: '250', styleName: 'left-column', dataType: 'text', header: { text: t('전체소속명') } },
    { fieldName: 'DEPT_CD', width: '100', dataType: 'text', header: { text: t('부서코드') } },
    { fieldName: 'ASGN_CD', width: '100', dataType: 'text', header: { text: t('소속코드') } },
    { fieldName: 'EMP_NO', width: '100', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'KOR_NM', width: '100', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'JOB_TIT_NM', width: '100', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'GRD_NM', width: '100', dataType: 'text', header: { text: t('직급') } },
    { fieldName: 'OFFI_RES_CD', width: '100', dataType: 'text', header: { text: t('직책코드') } },
    { fieldName: 'OFFI_RES_NM', width: '100', dataType: 'text', header: { text: t('직책명') } },
    { fieldName: 'WRK_PLC_NM', width: '100', dataType: 'text', header: { text: t('근무위치') } },
    { fieldName: 'HLD_OFFI_NM', width: '100', dataType: 'text', header: { text: t('재직여부') } },
    { fieldName: 'GRP_ENT_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('그룹입사일') } },
    { fieldName: 'COM_ENT_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('회사입사일') } },
    { fieldName: 'TMP_RST_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('휴직일자') } },
    { fieldName: 'TMP_RST_RSN', width: '250', dataType: 'text', styleName: 'left-column', header: { text: t('휴직사유') } }, 
    { fieldName: 'RETI_TMP_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('퇴직일자') } },
    { fieldName: 'JOB_GRP_CD_NM', width: '100', dataType: 'text', header: { text: t('고용형태') } },
    { fieldName: 'NATN_NM', width: '100', dataType: 'text', header: { text: t('국적') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  if (btn.id === 'btnSearch') {
    getData()
  } 
}
const getData = () => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
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
  searchParams.HLD_OFFI_GBN = `${searchParams.HLD_GBN_1},${searchParams.HLD_GBN_2},${searchParams.HLD_GBN_3}`
  if(searchParams.HLD_OFFI_GBN == ',,') searchParams.HLD_OFFI_GBN = ''
  return commonSearchApi({ queryId: 'HLTGA0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '[인사DB 대상자 조회] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

watch(() => [searchParams.HLD_GBN_1, searchParams.HLD_GBN_2, searchParams.HLD_GBN_3], (newValue, oldValue) => {
  getData()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <VCheckbox
            v-model="searchParams.HLD_GBN_1"
            :label="$t('재직')"
            true-value="1"
            false-value=""
            class="mr-5"
          />
          <VCheckbox
            v-model="searchParams.HLD_GBN_2"
            :label="$t('휴직')"
            true-value="2"
            false-value=""
            class="mr-5"
          />
          <VCheckbox
            v-model="searchParams.HLD_GBN_3"
            :label="$t('퇴직')"
            true-value="3"
            false-value=""
            class="mr-5"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
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
    min-height: 400px;
  }
}
</style>