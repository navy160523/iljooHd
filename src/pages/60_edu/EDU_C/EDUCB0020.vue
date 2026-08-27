<script setup>
import { onMounted, reactive, ref, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi2, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

import EDUCB0020Popup01 from '@/pages/60_edu/EDU_C/EDUCB0020Popup01.vue'
import EDUCB0020Popup02 from '@/pages/60_edu/EDU_C/EDUCB0020Popup02.vue'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const logStore = useLogsStore()
const userStore = useUserStore()
const grdTitleJic = ref(null)
const grdTitleEquip = ref(null)
const grdTitleTestList = ref(null)
const grdJic = ref(null)
const grdEquip = ref(null)
const grdTestList = ref(null)
const testRange = ref('')
const testPopup = ref(null)
const reviewPopup = ref(null)

const codeList = reactive({
  QUARTER: [
    { COD: '', TXT: '전체', },
    { COD: '1', TXT: '1분기', },
    { COD: '2', TXT: '2분기', },
    { COD: '3', TXT: '3분기', },
    { COD: '4', TXT: '4분기', },
  ]
})

const grdPropsJic = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, exclusive: true, },
  },
  fields: [
    { fieldName: 'JIC_NM', dataType: 'text', header: { text: t('직종명'), }, editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'JIC_SEQ', dataType: 'text', header: { text: t('JIC_SEQ'), }, visible: false, },
  ],
  columns: [],
})

grdPropsJic.columns = grdPropsJic.fields

const grdPropsEquip = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'EQUIP_NM', dataType: 'text', header: { text: t('장비명'), }, editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'EQUIP_SEQ', dataType: 'text', header: { text: t('EQUIP_SEQ'), }, visible: false, },
  ],
  columns: [],
})

grdPropsEquip.columns = grdPropsEquip.fields

const grdPropsTestList = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false, },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'TEST_ID', dataType: 'text', header: { text: t('응시번호'), }, width: '80', },
    { fieldName: 'YEAR_NM', dataType: 'text', header: { text: t('년도'), }, width: '80', },
    { fieldName: 'QUARTER_NM', dataType: 'text', header: { text: t('분기'), }, width: '80', },
    { fieldName: 'TEST_START_DATE', dataType: 'text', header: { text: t('응시일시'), }, width: '160', },
    { fieldName: 'TEST_TIME', dataType: 'text', header: { text: t('경과시간'), }, width: '80', },
    { fieldName: 'TEST_STATUS', dataType: 'text', header: { text: t('응시상태'), }, width: '80', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름'), }, width: '80', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '80', },
    { fieldName: 'TEST_POINT', dataType: 'text', header: { text: t('점수'), }, width: '80', },
    { fieldName: 'TEST_REVIEW', dataType: 'text', header: { text: t('결과조회'), },
      styleName: 'rg_blue font-weight-bold cursor-pointer', width: '80', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('USER_DIV'), }, visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR'), }, visible: false, },
    { fieldName: 'QUARTER', dataType: 'text', header: { text: t('QUARTER'), }, visible: false, },
    { fieldName: 'TEST_SEQ', dataType: 'text', header: { text: t('TEST_SEQ'), }, visible: false, },
    { fieldName: 'TEST_END_DATE', dataType: 'text', header: { text: t('TEST_END_DATE'), }, visible: false, },
  ],
  columns: [],
})

grdPropsTestList.columns = grdPropsTestList.fields

const userInfos = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CMPNY_NM: userStore.companyNm,
  USER_DIV: userStore.userDiv,
  BSNS_CD: userStore.bsnsCd,
  BSNS_NM: userStore.bsnsNm,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ASGN_CD: userStore.asgnCd,
  EMP_NO: userStore.empNo,
  EMP_NM: userStore.empNm,
})

const searchParams = reactive({
  YEAR: dayjs().format('YYYY'),
  QUARTER: '',
})

const onButtonsClickEquip = btn => {
  if(btn.id === 'btnUpdate') {
    const chkJics = grdJic.value.getGridView().getCheckedRows(true)
    const chkEquips = grdEquip.value.getGridView().getCheckedRows(true)

    if(chkJics.length < 1) {
      Message.warn(t('직종을 선택해주세요.'))
      return
    }
    
    vm.$swal({
      title: t('이대로 시험에 응시하시겠습니까?'),
      showCancelButton: true,
    }).then(confirmRes => {
      if (confirmRes.isConfirmed) {
        const goTestParams = {
          CMPNY_DIV: userInfos.CMPNY_DIV,
          USER_DIV: userInfos.USER_DIV,
          EMP_NO: userInfos.EMP_NO,
          BSNS_CD: userInfos.BSNS_CD,
          DEPT_CD: userInfos.DEPT_CD,
          ASGN_CD: userInfos.ASGN_CD,
          YEAR: dayjs().format('YYYY'),
          QUARTER: Math.ceil(dayjs().format('MM') * 1 / 3) + '',
          CHK_JIC: grdJic.value.getDataProvider().getJsonRow(chkJics[0]).JIC_SEQ,
          CHK_EQUIP: '',
        }

        chkEquips.forEach(row => {
          const equipSeq = grdEquip.value.getDataProvider().getJsonRow(row).EQUIP_SEQ

          goTestParams.CHK_EQUIP = goTestParams.CHK_EQUIP === '' ? equipSeq : `${goTestParams.CHK_EQUIP},${equipSeq}`
        })

        commonExecuteApi2({ queryId: 'EDUCB0020_SAVE_01', list: [goTestParams] }).then(res => {
          const testId = res.OUT_RES_KEY.split('@')[0]
          const testSeq = res.OUT_RES_KEY.split('@')[1]

          onButtonsClickTestList({ id: 'btnSearch' }, false)

          goTestParams.TEST_SEQ = testSeq
          testPopup.value.openPopup(goTestParams)
        })
      } 
    })
  }
}

const onButtonsClickTestList = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdTestList])
      .showMessage(showMsg)
      .setQuery(() => {
        grdTestList.value.getDataProvider().setRows([])
        return commonSearchApi({
          queryId: 'EDUCB0020_SEARCH_01',
          param: {
            CMPNY_DIV: userInfos.CMPNY_DIV,
            USER_DIV: userInfos.USER_DIV,
            EMP_NO: userInfos.EMP_NO,
            YEAR: searchParams.YEAR,
            QUARTER: searchParams.QUARTER,
          }
        })
      })
      .setAfter(res => {
        grdTestList.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
      .run()
  }
}

const searchJic = () => {
  commonSearchApi({
    queryId: 'EDUCB0010_SEARCH_02',
    param: { CMPNY_DIV: 'HHI',/*userStore.cmpnyDiv,*/ JIC_NM: '', USE_YN: 'Y', },
  }).then(res => {
    grdJic.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const searchEquip = () => {
  commonSearchApi({
    queryId: 'EDUCB0010_SEARCH_01',
    param: { CMPNY_DIV: 'HHI',/*userStore.cmpnyDiv,*/ EQUIP_NM: '', USE_YN: 'Y', },
  }).then(res => {
    grdEquip.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const searchTestRange = () => {
  const rangeParams = {
    CMPNY_DIV: 'HHI',/*userStore.cmpnyDiv,*/
    YEAR: dayjs().format('YYYY'),
    QUARTER: Math.ceil(dayjs().format('MM') * 1 / 3) + '',
  }

  commonSearchApi({
    queryId: 'EDUCB0010_SEARCH_06',
    param: rangeParams,
  }).then(res => {
    grdTitleEquip.value.disableBtn('btnUpdate', true)

    if(res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0]
      const today = dayjs().format('YYYY-MM-DD')

      testRange.value = `※ ${data.YEAR}년도 ${data.QUARTER}분기 응시 가능기간 ( ${data.TEST_START_DT} ~ ${data.TEST_END_DT} )`
      
      if(data.TEST_START_DT <= today && today <= data.TEST_END_DT) {
        grdTitleEquip.value.disableBtn('btnUpdate', false)
      }
    } else {
      testRange.value = `※ ${rangeParams.YEAR}년도 ${rangeParams.QUARTER}분기 응시 가능기간 ( X )`
    }
  })
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  const data = grdTestList.value.getDataProvider().getJsonRow(clickData.dataRow)

  if (clickData.fieldName === 'TEST_REVIEW') {
    if(data.TEST_REVIEW === '응시') {
      testPopup.value.openPopup(data)
    } else if(data.TEST_REVIEW === '확인') {
      reviewPopup.value.openPopup(data)
    }
  }
}

const closeTestPopup = isSubmit => {
  if(isSubmit) {
    onButtonsClickTestList({ id: 'btnSearch' }, false)
  }
}

onMounted(() => {
  nextTick(() => {
    grdTitleEquip.value.setBtnProperty('btnUpdate', 'text', '시험 응시')
    grdJic.value.getGridView().filterPanel.visible = true
    grdEquip.value.getGridView().filterPanel.visible = true
    searchJic()
    searchEquip()
    searchTestRange()
    onButtonsClickTestList({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        :title="`${$t(logStore.menuId)}`"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex justify-space-between align-center">
            <div style="font-size: 16px; color: #0000dd; font-weight: bold;">
              응시자 정보
            </div>
            <div style="font-size: 16px; color: #ff5353; font-weight: bold;">
              {{ testRange }}
            </div>
          </div>
          <div class="d-flex align-center mt-2">
            <i-input
              :label="$t('회사')"
              v-model="userInfos.CMPNY_NM"
              width="225px"
              readonly
            />
            <span class="mr-2">
              소속
            </span>
            <div
              class="px-3 py-1 mr-5"
              style="border-radius: 4px; background-color: #ffffff; border: 1px solid #e4e4e4;"
            >
              <v-radio-group
                v-model="userInfos.USER_DIV"
                inline
                readonly
              >
                <v-radio label="직영" value="A" />
                <v-radio label="사내협력사" value="B" />
                <v-radio label="단기공사" value="D" />
                <v-radio label="기타" value="Z" />
              </v-radio-group>
            </div>
            <i-input
              :label="$t('사업부')"
              v-model="userInfos.BSNS_NM"
              width="225px"
              readonly
            />
            <i-input
              :label="$t('부서')"
              v-model="userInfos.DEPT_NM"
              width="225px"
              readonly
            />
            <i-input
              :label="$t('성명')"
              v-model="userInfos.EMP_NM"
              width="150px"
              readonly
            />
            <i-input
              :label="$t('사번')"
              v-model="userInfos.EMP_NO"
              width="150px"
              readonly
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="325px" class="h-auto">
            <IGridTitle
              ref="grdTitleJic"
              :title="$t('직종 선택')"
            />
            <RealGrid
              ref="grdJic"
              :grid-view-option="grdPropsJic.gridViewOption"
              :keys="grdPropsJic.keys" 
              :fields="grdPropsJic.fields"
              :columns="grdPropsJic.columns"
            />
          </v-sheet>
          <v-sheet width="325px" class="h-auto ml-4">
            <IGridTitle
              ref="grdTitleEquip"
              :title="$t('장비 선택')"
              :button-list="['btnUpdate']"
              @click-button="onButtonsClickEquip"
            />
            <RealGrid
              ref="grdEquip"
              :grid-view-option="grdPropsEquip.gridViewOption"
              :keys="grdPropsEquip.keys" 
              :fields="grdPropsEquip.fields"
              :columns="grdPropsEquip.columns"
            />
          </v-sheet>
          <v-sheet width="calc(100% - 650px)" class="h-auto ml-4">
            <IGridTitle
              ref="grdTitleTestList"
              :title="$t('응시 이력')"
              :button-list="['btnSearch']"
              @click-button="onButtonsClickTestList"
            />
            <v-sheet class="searchArea">
              <div class="d-flex align-center">
                <i-input
                  width="160px"
                  :label="$t('년도')"
                  v-model="searchParams.YEAR"
                />
                <i-select
                  width="160px"
                  :label="$t('분기')"
                  :items="codeList.QUARTER"
                  item-value="COD"
                  item-title="TXT"
                  v-model="searchParams.QUARTER"
                />
              </div>
            </v-sheet>
            <RealGrid
              ref="grdTestList"
              :grid-view-option="grdPropsTestList.gridViewOption"
              :keys="grdPropsTestList.keys" 
              :fields="grdPropsTestList.fields"
              :columns="grdPropsTestList.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <EDUCB0020Popup01 ref="testPopup" @close="closeTestPopup" />
    <EDUCB0020Popup02 ref="reviewPopup" />
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 176px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>