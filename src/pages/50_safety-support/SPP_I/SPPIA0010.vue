<!-- SPPIA0010 폭발위험장소 현황 -->
<!-- SI2팀 손상규 2025-01-06 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user';
import { useMenuStore } from '@hiway/stores/menu'
import { commonSearchApi, getCodeList, commonExecuteApi,} from '@hiway/api/commonApi';
import queryFlowHelper from '@/utils/searchFlowHelper';
import saveFlowHelper from '@/utils/saveFlowHelper'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import SPPIA0010Popup from '@/pages/50_safety-support/SPP_I/SPPIA0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

defineOptions({
  name:'50_safety-support-SPP_I-SPPIA0010',
})

const userStore = useUserStore()
const menuStore = useMenuStore()
const logStore = useLogsStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

//팝업
const deptPopup = ref(null)
const sppia0010Popup = ref(null)
const fileUploadPopup = ref(null) //파일업로드 팝업
const fileTitle = ref('')
const selectedRow = ref(null)

const searchParams = reactive({
  AREA_DIV: ''
})

const codeList = reactive({
  areaList: [],
  areaColumnList: [],
  deptList: [],
  USAGE_LIST: [
    { COD: 'A', TXT: '우수' },
    { COD: 'B', TXT: '양호' },
    { COD: 'C', TXT: '미흡' },
  ],
  expResultList: [
    {CODE: 'Y' , NAME: '대상'},
    {CODE: 'N' , NAME: '비대상'},
  ]
})

const initCodeList = () => {
  Promise.all([ 
    getCodeList('HHIU010'), //지역구분(시스템코드에 새로만들었음)
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null} }) // 부서
  ]).then(res => {    
    codeList.areaList = res[0].ORESULT_CUR
    codeList.areaList.unshift({ TXT: '전체', COD: '' });
    codeList.areaColumnList = res[0].ORESULT_CUR.filter(item => item.COD !== '')
    codeList.deptList = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('AREA_DIV', codeList.areaColumnList, 'COD', 'TXT')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptList, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('USAGE', codeList.USAGE_LIST, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXPL_TAR', codeList.expResultList, 'CODE', 'NAME')
  })
}

const onDeptSelected = (val) => {

  // val이 배열인지 확인
  const codes = Array.isArray(val)
    ? val.map(v => v.DEPT_CD).join(',') // A,B,C
    : val.DEPT_CD; // 단일 선택일 경우

  grdMain.value.getDataProvider().setValue(selectedRow.value, 'DEPT_CD', codes);
}

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : {checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['IDX_SEQ', 'MANAGE_NUM'],
  fields : [ 
    {
      fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일ID') }, editable: false, visible: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
          if (value == 'Y') {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px;"
                >첨부 완료</button>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px;"
                >첨부</button>
              </div>
            `;
          }
        }
      }
    },
    {
      fieldName: 'AREA_DIV', dataType: 'text', header: { text: t('지역구분') }, styleName: 'editable_column', editable: true, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    { fieldName: 'FAC_DIV', dataType: 'text', header: { text: t('공장(또는 설비)구분') }, styleName: 'editable_column', editable:true},
    { fieldName: 'TARGET_AREA', dataType: 'text', header: { text: t('대상 구역') }, styleName: 'editable_column', editable:true},
    { fieldName: 'COORDI', dataType: 'text', header: { text: t('위경도') }, styleName: 'editable_column', editable:true},
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('순번(참조용)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'MANAGE_NUM', dataType: 'text', header: { text: t('관리번호') }, editable:false},
    {
      fieldName: 'PLAN_NUM', dataType: 'text', header: { text: t('도면번호') }, width: '300', styleName: 'editable_column', editable: true,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'PLAN_NUM') ?? '';
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px; position: relative;">
              <div style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${value}
              </div>
              <i class="mdi mdi-map-marker-radius plan-map-icon"
                data-index="${cell.index.itemIndex}"
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); color: #1a40c7; font-size: 18px; cursor: pointer;">
              </i>
            </div>
          `;
        }
      }
    },
    { fieldName: 'DOOR_DIV', dataType: 'text', header: { text: t('옥내/옥외') }, editable:false},
    { fieldName: 'TARGET_FAC', dataType: 'text', header: { text: t('대상설비(장비명)') }, editable:false},
    {
      fieldName: 'DEPT_CD', dataType: 'text',width: '150', header: { text: t('관리부서') }, styleName: 'editable_column', editable: false, lookupDisplay: true,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'DEPT_CD');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);

          const codeArray = value ? value.split(',') : [];

          const displayNames = codeArray.map(cd => {
            const match = codeList.deptList.find(item => item.DEPT_CD === cd.trim());
            return match ? match.DEPT_NM : cd.trim();
          });
          
          // 부서가 2개 이상일 경우에만 줄바꿈
          const displayValue = displayNames.length > 1
            ? displayNames.join('<br>')
            : displayNames[0] ?? '';

          if (rowState) {
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px; position: relative;">
              <div style="flex: 1; white-space: normal; word-break: keep-all;">
                ${displayValue}
              </div>
              <i class="mdi mdi-magnify popup-search-icon" 
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); cursor: pointer;"></i>
            </div>
          `;
          }
        }
      }
    },
    { fieldName: 'SUBS_NM', dataType: 'text', header: { text: t('물질명') }, editable:false},
    { fieldName: 'DILUTION', dataType: 'text', header: { text: t('희석') }, editable:false},
    { fieldName: 'USAGE', dataType: 'text', header: { text: t('이용도') }, editable:false, lookupDisplay: true},
    { fieldName: 'EXPL_TYPE', dataType: 'text', header: { text: t('종') }, editable:false},
    { fieldName: 'RANGE', dataType: 'text', header: { text: t('범위') }, editable:false},
    { fieldName: 'STATE_MAT', dataType: 'text', header: { text: t('물질상태(기체/액체)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'MOLECULAR', dataType: 'text', header: { text: t('분자량') }, editable:false},
    { fieldName: 'LOWER_EXPL', dataType: 'text', header: { text: t('폭발하한') }, editable:false},
    { fieldName: 'POLYTRO', dataType: 'text', header: { text: t('폴리트로픽 지수') }, editable:false},
    { fieldName: 'VAPOR_PRE', dataType: 'text', header: { text: t('증기압(mmHg)(액체만 해당)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'LIQUID_DENS', dataType: 'text', header: { text: t('액체밀도(액체만 해당)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'FLASH_POINT', dataType: 'text', header: { text: t('인화점') }, styleName: 'editable_column', styleName: 'editable_column', editable:true},
    { fieldName: 'EXPL_TAR', dataType: 'text', header: { text: t('방폭 설정 적용대상(주3)') }, editable:false, lookupDisplay: true},
    { fieldName: 'OPER_TEM', dataType: 'text', header: { text: t('운전온도') }, styleName: 'editable_column', editable:true},
    { fieldName: 'POWER_PRE', dataType: 'text', header: { text: t('동력기계 운전압력(kgf/cm2)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'FAC_PRE', dataType: 'text', header: { text: t('고정설비 운전압력(kgf/cm2)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'REGF_PRE', dataType: 'text', header: { text: t('Regulator 전단 압력(kgf/cm2)') }, editable:false},
    { fieldName: 'REGR_PRE', dataType: 'text', header: { text: t('Regulator 후단 압력(kgf/cm2)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'PIPE_SIZE', dataType: 'text', header: { text: t('배관 사이즈') }, styleName: 'editable_column', editable:true},
    { fieldName: 'GASKET_MAT', dataType: 'text', header: { text: t('가스켓 형태 및 재질') }, styleName: 'editable_column', editable:true},
    { fieldName: 'DETECT_TYPE', dataType: 'text', header: { text: t('검출시스템 유형(액체 누출 대상)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'BLOCK_TYPE', dataType: 'text', header: { text: t('차단시스템 유형(액체 누출 대상)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'WIDTH', dataType: 'text', header: { text: t('가로(m)') }, editable:false},
    { fieldName: 'LENGTH', dataType: 'text', header: { text: t('세로(m)') }, editable:false},
    { fieldName: 'HEIGHT', dataType: 'text', header: { text: t('높이(m)') }, editable:false},
    { fieldName: 'VOLUME', dataType: 'text', header: { text: t('체적(m3)') }, editable:false},
    { fieldName: 'EXHAUST_SIZE', dataType: 'text', header: { text: t('배기덕트 사이즈') }, styleName: 'editable_column', editable:true},
    { fieldName: 'EXHAUST_WIND', dataType: 'text', header: { text: t('배기덕트 풍속 측정결과') }, styleName: 'editable_column', editable:true},
    { fieldName: 'EXHAUST_POSI', dataType: 'text', header: { text: t('배기덕트 위치(상부/측면/하부)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'FORCED_VENT', dataType: 'text', header: { text: t('강제환기량(환기유량*개수)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'EXHAUST_AREA', dataType: 'text', header: { text: t('배기구 면적(가로x세로)m2') }, editable:false},
    { fieldName: 'EXHAUST_NUM', dataType: 'text', header: { text: t('배기구 개수') }, styleName: 'editable_column', editable:true},
    { fieldName: 'EXHAUST_LOCA', dataType: 'text', header: { text: t('배기구 위치(상부/측면/하부)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'AIRSUP_AREA', dataType: 'text', header: { text: t('급기구 면적(가로x세로)m2') }, editable:false},
    { fieldName: 'AIRSUP_NUM', dataType: 'text', header: { text: t('급기구 개수') }, styleName: 'editable_column', editable:true},
    { fieldName: 'AIRSUP_LOCA', dataType: 'text', header: { text: t('급기구 위치(상부/측면/하부)') }, styleName: 'editable_column', editable:true},
    { fieldName: 'VENT_YN', dataType: 'text', header: { text: t('대기방출 안전밸드 또는 VENT 유무') }, styleName: 'editable_column', editable:true},
    { fieldName: 'DIKE_YN', dataType: 'text', header: { text: t('다이크 여부(가로x세로)m2') }, styleName: 'editable_column', editable:true},
    { fieldName: 'REMARK', dataType: 'text', width:'200', header: { text: t('비고') }, styleName: 'editable_column' , editable:true},

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible:false},
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible:false},
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible:false},
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('키시퀀스') }, visible:false},
    { fieldName: 'FILE_YN', dataType: 'text', header: { text: t('파일존재여부') }, visible:false},
  ],
  columnLayout: [
    'FILE_ID',
    {
      name: '구분',
      direction: 'horizontal',
      items: [  'AREA_DIV', 'FAC_DIV', 'TARGET_AREA'  ],
      header: { text: t('구분') }
    },
    'COORDI',
    'SEQ',
    'MANAGE_NUM',
    'PLAN_NUM',
    'DOOR_DIV',
    'TARGET_FAC',
    'DEPT_CD',
    'SUBS_NM',
    {
      name: '방폭 결과 구분',
      direction: 'horizontal',
      items: [  'DILUTION', 'USAGE', 'EXPL_TYPE', 'RANGE'  ],
      header: { text: t('방폭 결과 구분') }
    },
    {
      name: '취급물질 정보',
      direction: 'horizontal',
      items: [  'STATE_MAT', 'MOLECULAR', 'LOWER_EXPL', 'POLYTRO', 'VAPOR_PRE', 'LIQUID_DENS', 'FLASH_POINT', 'EXPL_TAR'  ],
      header: { text: t('취급물질 정보') }
    },
    {
      name: '운전정보 정보',
      direction: 'horizontal',
      items: ['OPER_TEM', 'POWER_PRE', 'FAC_PRE',
        {
          name: '배관 설비',
          direction: 'horizontal',
          items: [  'REGF_PRE', 'REGR_PRE', 'PIPE_SIZE', 'GASKET_MAT'  ],
          header: { text: t('배관 설비')}
        },
        'DETECT_TYPE',
        'BLOCK_TYPE'
      ],
      header: { text: t('운전정보 정보') }
    },
    {
      name: '환기 대상 공간 제적 정보',
      direction: 'horizontal',
      items: [  'WIDTH', 'LENGTH', 'HEIGHT', 'VOLUME'  ],
      header: { text: t('환기 대상 공간 제적 정보') }
    },
    {
      name: '환기정보',
      direction: 'horizontal',
      items: [
        {
          name: '옥내 강제환기',
          direction: 'horizontal',
          items: [  'EXHAUST_SIZE', 'EXHAUST_WIND', 'EXHAUST_POSI', 'FORCED_VENT'  ],
          header: { text: t('옥내 강제환기')}
        },
        {
          name: '옥내 자연환기',
          direction: 'horizontal',
          items: [  'EXHAUST_AREA', 'EXHAUST_NUM', 'EXHAUST_LOCA', 'AIRSUP_AREA', 'AIRSUP_NUM', 'AIRSUP_LOCA'  ],
          header: { text: t('옥내 자연환기')}
        }
      ],
      header: { text: t('환기정보') }
    },
    'VENT_YN',
    'DIKE_YN',
    'REMARK'
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

//그리드 데이터 입력

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
  // 확장권한 ADMIN 일때 컬럼 visible처리 
  const logMenuId = logStore.menuId
  const adminUserList = userStore.buttonPermission.filter(item => item.menu_id == logMenuId)
  const permissionList = adminUserList[0].actions
  if (permissionList.includes('ADMIN')) { 
    grdMain.value.getGridView().setColumnProperty('FILE_ID', 'visible', true)
  } else {
    grdMain.value.getGridView().setColumnProperty('FILE_ID', 'visible', false)
  }

  /* document.addEventListener('click', (event) => {
    const target = event.target;
    
    // 클릭한 요소가 아이콘인지 확인
    if (target.classList.contains('plan-map-icon')) {
      const index = target.dataset.index;
      if (index !== undefined) {
        const innerData = grdMain.value.getDataProvider().getJsonRow(Number(index));
        sppia0010Popup.value.openPopup(innerData);
      }
    }
  }); */
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(() => {
        return commonSearchApi({
          queryId: "SPPIA0010_SEARCH_01",
          param: searchParams,
        })
      })
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  } else if (btn.id === 'btnUpdate') { 
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  }
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);

  grdMain.value.setDisplayOptions({
    columnResizable: true, // 컬럼 크기 조정 가능
    rowResizable: true // 사용자가 마우스로 행 높이 변경 가능
  });
  
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    // if (isEmpty(data.MNG_SEQ)) {
    //   return Message.warn(t('관리순번은 필수 입력입니다.'))
    // } else if (isEmpty(data.GRADE)) { 
    //   return Message.warn(t('급수는 필수 입력입니다.'))
    // } else if (isEmpty(data.INFEC_NM)) { 
    //   return Message.warn(t('명칭은 필수 입력입니다.'))
    // } else if (isEmpty(data.CONTACT_CLS)) { 
    //   return Message.warn(t('접촉자 분류는 필수 입력입니다.'))
    // }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPIA0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  onButtonsClick({ id: 'btnSearch' });
  initCodeList()
}

const reset = () => {
  searchParams.INJR_DEPT_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
  searchParams.ASGN_NM = ''

  grdMain.value.getDataProvider().setRows()
}

const upData = () => {
  onButtonsClick({ id: "btnSearch" })
}

//파일업로드 임시기능, 부서팝업
const onCellItemClicked = (grid, index, col) => {
  const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  
  if (col.column == 'FILE_ID') {
    if (col.target.className === 'v-btn') {
      fileTitle.value = '폭발위험장소 산출물 파일첨부'
      selectedRow.value = index.dataRow
      fileUploadPopup.value.openPopup(data.FILE_ID)
    }
  } else if (col.column == 'DEPT_CD') {
    selectedRow.value = index.dataRow
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: "Y"
    })
  } else if(col.column  == 'PLAN_NUM') {
    console.log('col.target.className ::: ', col.target.className)
    if (col.target.className === 'mdi mdi-map-marker-radius plan-map-icon') {
      sppia0010Popup.value.openPopup(data)
    }
  }
}

const uploaded = (val) => { 
  let saveParams = []

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    IDX_SEQ: data.IDX_SEQ,
    MANAGE_NUM: data.MANAGE_NUM,
    FILE_ID: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPIA0010_UPDATE_01', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })

}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">         
          <i-select
            :label="$t('지역구분')"
            width="300px"
            labelWidth="50px" 
            placeholder="지역구분"
            v-model="searchParams.AREA_DIV"
            :items="codeList.areaList"
            item-value="COD"
            item-title="TXT"
            @update:modelValue="reset"
          />
          <!-- <i-input
            :label="$t('부서')"
            v-model="searchParams.ASGN_NM"
            width="300px"
            labelWidth="35px"
            margin="4px"
            readonly
            append-inner-icon="mdi-magnify"
            @keydown.enter=" (e) => { openPopup() } "
            @update:modelValue=" (e) => { searchParams.DEPT_CD = null } "
            @click:appendInner="openPopup()"
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.INJR_DEPT_CD"
            width="80px"
            readonly
          /> -->
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
        <DeptPopup ref="deptPopup" @selected="onDeptSelected" :checkBar="true" />
      </div>
    </v-card-text>
  </v-card>
  <SPPIA0010Popup ref="sppia0010Popup" @upData="upData" />
  <IUploadPopup ref="fileUploadPopup" :gridTitle="fileTitle" @uploaded="uploaded"/>
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

</style>
