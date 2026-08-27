<!--
  화면명 : 장비자격 보수교육 현황
  화면개요 : 장비자격 보수교육 현황을 확인할 수 잇는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from '@/utils/searchFlowHelper'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'

defineOptions({
  name: "60_edu-EDU_B-EDUBA0050",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : userStore.bsnsCd,        // 사업부
  DEPT_CD : userStore.asgnCd,        // 부서
  LIC_KIND: [],
  LIC_STATUS: [],
})

const codeList = reactive({
  bsnsCd: [],
  deptCd: [],
  licKind: [],
  licStatus: [
    { TXT: '보유', COD: 'N' },
    { TXT: '보수교육임박', COD: 'Y' },
    { TXT: '정지', COD: 'O' },
    { TXT: '취소', COD: 'R' },
  ],
})

const kindAll = ref('Y')
const statusAll = ref('Y')

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { edit: { editable:false } },
  keys : [],
  fields : [ 
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, width: '270',styleName: 'left-column' },
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, width: '150',styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') } },
    { fieldName: 'LIC_GET_DT', dataType: 'text', header: { text: t('자격취득일') } },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('보수교육일') } },
    { fieldName: 'LIC_STATUS', dataType: 'text', header: { text: t('자격상태') } },


    { fieldName: 'ALM_TARGET', dataType: 'text', header: { text: t('ALM_TARGET') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }else {
    let params = {
      PATH : 'Pdf',
      FILE_PATH: 'EDU_B',
      FILE_NAME: '장비자격 보수교육 기준.pdf',  
    }
    commonSampleDownFilesApi(params)
  }
}

const searchData = () => {
  let data = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,        // 사업부
    DEPT_CD : searchParams.DEPT_CD,        // 부서
    LIC_KIND: searchParams.LIC_KIND,
    LIC_STATUS: [],
  }
  if(searchParams.LIC_STATUS.length > 0){
    searchParams.LIC_STATUS.forEach(item => {
      if(item.COD){
        data.LIC_STATUS.push(item.COD)
      }else {
        data.LIC_STATUS.push(item)
      }
    })
  }

  if(codeList.licKind.length === searchParams.LIC_KIND.length){
    data.LIC_KIND = ''
  }

  return commonSearchApi({ queryId : 'EDUBA0050_SEARCH_01', param: data })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  /* ** ROW 스타일 지정 ** */
  status()
}

const changedBSNS_CD = val => {
  Promise.all([
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: val, USE_DIV:'Y' } }), // 부서
  ]).then(res => {
    /* ************** 부서 데이터 세팅 **************** */
    codeList.deptCd = res[0].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    searchParams.DEPT_CD = ''
  })

}

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }),
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_DIV:'Y' } }),
    commonSearchApi({ queryId : 'searchLicKind2', param : { CMPNY_DIV: userStore.cmpnyDiv } }),
  ]).then(res => {

    /* ************ 사업부 데이터 세팅 ************* */
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD: '' })

    /* ************* 부서 데이터 세팅 ************** */
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    /* ************* 장비자격 데이터 세팅 ************* */
    codeList.licKind = res[2].ORESULT_CUR
    searchParams.LIC_KIND = codeList.licKind

    searchParams.LIC_STATUS = codeList.licStatus
  })
}

//진행상태에 따른 ROW 색상 변경
const status = () => {
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let targetData = grid.getValue(item.index, "ALM_TARGET")

    if(targetData === 'R'){//취소
      ret.style = { background: "rgb(166,166,166)" }
    }else if(targetData === 'O'){//정지
      ret.style = { background: "rgb(241,95,95)" }
    }else if(targetData === 'Y'){//보수기한임박
      ret.style = { background: "rgb(250,237,125)" }
    } else {
      ret = { background: "rgb(255,255,255)" }
    }

    return ret
  })
}

/* *********** VAutocomplete 전체선택 이벤트 *********** */
const kindAllClick = e => {
  if(kindAll.value === 'Y'){
    kindAll.value = 'N'
  } else {
    kindAll.value = 'Y'
  }

  kindSelectAll()
}

const kindSelectAll = () => {
  grdMain.value.getDataProvider().setRows([])
  if(kindAll.value === 'Y'){
    searchParams.LIC_KIND = []
    searchParams.LIC_KIND = codeList.licKind
  } else {
    searchParams.LIC_KIND = []  
  }
}

const handleSelect = gbn => {
  grdMain.value.getDataProvider().setRows([])
  if(gbn === 'LIC_KIND'){
    kindAll.value = 'N'
  }else {
    statusAll.value = 'N'
  }
}

const statusAllClick = e => {
  grdMain.value.getDataProvider().setRows([])
  if(statusAll.value === 'Y'){
    statusAll.value = 'N'
  } else {
    statusAll.value = 'Y'
  }

  statusSelectAll()
}

const statusSelectAll = () => {
  grdMain.value.getDataProvider().setRows([])
  if(statusAll.value === 'Y'){
    searchParams.LIC_STATUS = []
    searchParams.LIC_STATUS = codeList.licStatus
  } else {
    searchParams.LIC_STATUS = []  
  }
}

/* *********** VAutocomplete 전체선택 이벤트 종료 *********** */

onMounted(() => {
  initCodeList()
  onButtonsClick({id: 'btnSearch'})
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle 
        :title="$t(useLogsStore().menuId)"
        ref="menuTitle"
        :button-list="['btnEquipmentManual','btnSearch']"
        @click-button="onButtonsClick"  
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('사업부')"
            labelWidth="50px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            @update:model-value="changedBSNS_CD"
            width="300px"
          />
          <i-select
            :label="$t('부서')"
            labelWidth="40px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            width="300px"
          />

          <div class="d-flex align-center pl-8">
            <div class="formLabelText mr-5">
              {{ $t('자격종류') }}
            </div>
            <VAutocomplete
              v-model="searchParams.LIC_KIND"
              :items="codeList.licKind"
              item-title="TXT"
              item-value="COD"
              multiple
              clearable
              @update:model-value="handleSelect('LIC_KIND')"
              class="test"
            >
              <template v-slot:prepend-item>
                <v-list-item 
                  :class="kindAll === 'Y' ? 'select' : 'unselect'"
                  @click="kindAllClick"
                >
                  <v-list-item-title>
                    <VRow align="center">
                      <VCol cols="auto pl-1">
                        <v-checkbox 
                          v-model="kindAll"
                          @change="kindSelectAll"
                          color="rgb(33, 33, 33)"
                        />
                      </VCol>
                      <VCol>
                        <span>전체 선택</span>
                      </VCol>
                    </VRow>
                  </v-list-item-title>
                </v-list-item>
              </template>
            </VAutocomplete>
          </div>

          <div class="d-flex align-center pl-8">
            <div class="formLabelText mr-5">
              {{ $t('자격상태') }}
            </div>
            <VAutocomplete
              v-model="searchParams.LIC_STATUS"
              :items="codeList.licStatus"
              item-title="TXT"
              item-value="COD"
              multiple
              clearable
              @update:model-value="handleSelect('LIC_STATUS')"
            >
              <template v-slot:prepend-item>
                <v-list-item 
                  :class="statusAll === 'Y' ? 'select' : 'unselect'"
                  @click="statusAllClick"
                >
                  <v-list-item-title>
                    <VRow align="center">
                      <VCol cols="auto pl-1">
                        <v-checkbox 
                          v-model="statusAll"
                          @change="statusSelectAll"
                          color="rgb(81, 77, 88)"
                        />
                      </VCol>
                      <VCol>
                        <span>전체 선택</span>
                      </VCol>
                    </VRow>
                  </v-list-item-title>
                </v-list-item>
              </template>
            </VAutocomplete>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div style="height:3%; justify-content: flex-end;" class="d-flex mb-2">
            <div class="mr-1" style="background-color: #FAED7D; font-size: large; border-radius: 5px;">　　</div>
            <div class="mr-2" style="font-size: large;"> 교육 기간 임박</div>
            <div class="mr-1" style="background-color: #A6A6A6; font-size: large; border-radius: 5px;">　　</div>
            <div class="mr-2" style="font-size: large;"> 취소</div>
            <div class="mr-1" style="background-color: #F15F5F; font-size: large; border-radius: 5px;">　　</div>
            <div class="mr-2" style="font-size: large;"> 정지</div>
          </div>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
::v-deep(.v-field__field) {
  //overflow-y: auto;
  // overflow-y: hidden;
  max-height: 35px;
}
.select {
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}
.unselect:hover{
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}
::v-deep(.test>.v-input__control>.v-field>.v-field__field) {
  overflow-y: auto;
}
.test{
  width: 350px;
}
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>