<!-- SPPFG0010 도급업체안전관리 -->


<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
  nullToEmpty,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty, isEmptyArray } from "@/@core/utils"
import { useRouter } from 'vue-router'
import SPPFG0010Popup from './SPPFG0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'


defineOptions({
  name: '50_safety-support-SPP_F-SPPFG0010',
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter()
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)
const isAdmin = ref(false)

const sppfg0010Popup = ref(null)

const vendDataPopup = ref(null)
const vendDataTitle = ref('')

const confirmVendPopup = ref(null)

const safePlanPopup = ref(null)
const safePlanTitle = ref('')

const inVendEvalPopup = ref(null)
const inVendEvalTitle = ref('')

const evalResPopup = ref(null)
const evalResTitle = ref('')

const evalDataPopup = ref(null)
const evalDataTitle = ref('')

const shortPjtSafeEvalPopup = ref(null)
const shortPjtSafeEvalTitle = ref('')

const shortPjtOshcEvalPopup = ref(null)
const shortPjtOshcEvalTitle = ref('')

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  BSNS_CD: userStore.bsnsCd || '',
  DEPT_CD: userStore.deptCd || '',
  USER_DIV: '',
})

onMounted(() => {

  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 5,
    })
  })  

  grdMain.value.getGridView().layoutByColumn("MINUTES").spanCallback = function (grid, layout, itemIndex) {
    return 3; //가로 병합 수
  };

  if (userStore.authGrpCd.includes('SPPF001') || userStore.authGrpCd.includes('SPPF002')) { 
    isAdmin.value = true
  }
})

const codeList = reactive({

})

const initCodeList = () => {
  Promise.all([ 
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),
  ]).then(res => {    
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptCd, 'DEPT_CD', 'DEPT_NM')
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })

  //사업부 변경시 부서 조회
  watch(
    () => searchParams.BSNS_CD,
    (newValue) => {
      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV: 'Y'
        }
      }).then((res) => {
        searchParams.DEPT_CD = ''
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      })
    }
  )
}


//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    edit: { editable: true },
    header: { height: 110, minHeight: 60 }
  },
  keys : [],
  fields : [
    { 
      fieldName: 'BSNS_CD', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('사업부'),}, lookupDisplay: true, editable: false
    },
    { 
      fieldName: 'DEPT_CD', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('부서') }, lookupDisplay: true, editable: false
    },
    { 
      fieldName: 'VEND_DIV', dataType: 'text', width: '100', styleName: 'editable_column change_back_check',
      header: { text: t('사내협력사') }, editable: false,
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
      styleCallback: function (grid, dataCell) { 
        var ret = {}
        const itemIndex = dataCell.index.itemIndex;
        const rowState = grid.getDataSource().getRowState(itemIndex);
        const DAN_DIV = grid.getValue(itemIndex, 'DAN_DIV')
 
        if (rowState !== 'created') {
          ret.renderer = { type: "check", editable: false }
          ret.style = { background:'#FFFFFF' }
        } else if (rowState == 'created' && DAN_DIV == 'N') {
          ret.editable = true
          ret.style = { background: '#eff8fd' }
        } else if (rowState == 'created' && DAN_DIV == 'Y') { 
          ret.editable = false
          ret.style = { background: '#eff8fd' }
        }
  
        return ret;
      }
    },
    { 
      fieldName: 'DAN_DIV', dataType: 'text', width: '100', styleName: 'editable_column change_back_check',
      header: { text: t('단기공사') }, editable: false,
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
      styleCallback: function (grid, dataCell) { 
        var ret = {}
        const itemIndex = dataCell.index.itemIndex;
        const rowState = grid.getDataSource().getRowState(itemIndex);
        const VEND_DIV = grid.getValue(itemIndex, 'VEND_DIV')
 
        if (rowState !== 'created') {
          ret.renderer = { type: "check", editable: false }
          ret.style = { background:'#FFFFFF' }
        } else if (rowState == 'created' && VEND_DIV == 'N') {
          ret.editable = true
          ret.style = { background: '#eff8fd' }
        } else if (rowState == 'created' && VEND_DIV == 'Y') { 
          ret.editable = false
          ret.style = { background: '#eff8fd' }
        }
  
        return ret;
      }
    },
    { 
      fieldName: 'VEND_NM', dataType: 'text', width: '120', styleName: 'editable_column center-column',
      header: { text: t('협력사명') },
      styleCallback: function (grid, dataCell) { 
        var ret = {}
        const itemIndex = dataCell.index.itemIndex;
        const rowState = grid.getDataSource().getRowState(itemIndex);
        const VEND_FLAG = grid.getValue(itemIndex, 'VEND_FLAG')
 
        if (rowState !== 'created' && VEND_FLAG != null) {
          ret.editable = false
          ret.style = { background:'#FFFFFF' }
        } 
  
        return ret;
      }
    },
    {
      fieldName: 'VEND_DATA', dataType: 'text', width: '180', styleName: 'center-column',
      header: { text: t('도급업체\n자료제공 현황') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const itemIndex = cell.index.itemIndex;
          const value = grid.getValue(itemIndex, 'VEND_COUNT');
          const flag = grid.getValue(itemIndex, 'VEND_FLAG');
          const rowState = grid.getDataSource().getRowState(itemIndex);

          // 플래그가 Y일 경우만 상태 텍스트 표시
          const isRegistered = value > 0;
          const statusText = isRegistered ? '첨부 완료' : '첨부';
          const statusColor = isRegistered ? '#008000' : '#1a40c7';

          if (rowState !== 'created' && flag == 'Y') {
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 5px;">
                <div style="display: flex;">
                  <button 
                    class="v-btn a" 
                    style="color: #fff; background: #008000; padding:4px; min-width:80px; margin-right: 3px;">
                    작성완료
                  </button>
                  <button 
                    class="v-btn b" 
                    style="color: #fff; background: ${statusColor}; padding:4px 12px; min-width:80px">
                    ${statusText}
                  </button>
                </div>
              </div>
            `;
          } else if (rowState !== 'created' && flag == 'N') {
            return `
              <div style="display: flex; justify-content: center; align-items: center; padding: 0 5px;">
                <button 
                  class="v-btn a" 
                  style="color: #fff; background: orange; padding:4px; min-width:80px; margin-right: 3px;">
                  현황작성중
                </button>
              </div>
            `;
          } else if (rowState !== 'created') {
            return `
              <div style="display: flex; justify-content: center; align-items: center; padding: 0 5px;">
                <button 
                  class="v-btn a" 
                  style="color: #fff; background: #1a40c7; padding:4px; min-width:80px">
                  현황작성
                </button>
              </div>
            `;
          } else if (rowState === 'created') { 
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          }
        }
      }
    },
    {
      fieldName: 'SAFE_PLAN', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('안전관리\n계획서') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'SAFE_COUNT');
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || DAN_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && VEND_DIV == 'Y') {
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #008000; padding:4px 12px; min-width:80px"
                  >첨부 완료</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding:4px 12px; min-width:80px"
                  >첨부</button> 
                </div>
              `;
            }
          }
        }
      }
    },
    {
      fieldName: 'IN_VEND_EVAL', dataType: 'text', width: '120', styleName: 'center-column',
      header: { text: t('사내협력사\n심의위원회평가') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'IN_VEND_COUNT');
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || DAN_DIV == 'Y' || !isAdmin.value) {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && VEND_DIV == 'Y' && isAdmin.value) {
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #008000; padding:4px 12px; min-width:80px"
                  >첨부 완료</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding:4px 12px; min-width:80px"
                  >첨부</button> 
                </div>
              `;
            }
          }
        }
      }
    },
    {
      fieldName: 'SAFE_STD_EVAL', dataType: 'text', width: '180', styleName: 'left-column',
      header: { text: t('안전보건\n수준평가') }, editable: false, 
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || DAN_DIV == 'Y' || !isAdmin.value) {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && VEND_DIV == 'Y' && isAdmin.value) { 
            return `
              <button
                class="v-btn"
                style="color:#fff; background:#8e8b8b; padding:4px 12px; min-width:80px;"
              >
                안전보건 수준평가결과 링크
              </button>
            `;
          }
        },
      }
    },
    {
      fieldName: 'SAFE_CHECK', dataType: 'text', width: '160', styleName: 'left-column',
      header: { text: t('합동\n안전보건점검') }, editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || DAN_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && VEND_DIV == 'Y') {
            return `
              <button
                class="v-btn"
                style="color:#fff; background:#8e8b8b; padding:4px 12px; min-width:80px;"
              >
                합동안전보건점검 링크
              </button>
            `;
          }
        },
      }
    },
    {
      fieldName: 'MINUTES', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('회의록') }, editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || DAN_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && VEND_DIV == 'Y') {
            return `
              <button
                class="v-btn"
                style="color:#fff; background:#8e8b8b; padding:4px 12px; min-width:80px;"
              >
                협력사 안전보건협의회 회의관리 링크
              </button>
            `;
          }
        },
      }
    },
    {
      fieldName: 'A', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('참석자\n명단') }, editable: false,
    },
    {
      fieldName: 'B', dataType: 'text', width: '120', styleName: 'center-column',
      header: { text: t('협력사 종사자\n의견청취 현황') }, editable: false,
    },
    {
      fieldName: 'EVAL_RES', dataType: 'text', width: '120', styleName: 'center-column',
      header: { text: t('평가 결과') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'EVAL_RES_COUNT');
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || VEND_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && DAN_DIV == 'Y') {
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #008000; padding:4px 12px; min-width:80px"
                  >첨부 완료</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding:4px 12px; min-width:80px"
                  >첨부</button> 
                </div>
              `;
            }
          } 
        }
      }
    },
    {
      fieldName: 'EVAL_DATA', dataType: 'text', width: '120', styleName: 'center-column',
      header: { text: t('평가 자료') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'EVAL_DATA_COUNT');
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || VEND_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && DAN_DIV == 'Y') {
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #008000; padding:4px 12px; min-width:80px"
                  >첨부 완료</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding:4px 12px; min-width:80px"
                  >첨부</button> 
                </div>
              `;
            }
          }
        }
      }
    },
    {
      fieldName: 'SHORT_PJT_SAFE_EVAL', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('[공사완료 후]\n단기공사\n안전보건평가') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'SHORT_COUNT');
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created' || VEND_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && DAN_DIV == 'Y') {
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #008000; padding:4px 12px; min-width:80px"
                  >첨부 완료</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding:4px 12px; min-width:80px"
                  >첨부</button> 
                </div>
              `;
            }
          }
        }
      }
    },
    {
      fieldName: 'SHORT_PJT_OSHC_EVAL', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('단기공사\n안전보건협의회') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'SHORT_OSHC_COUNT');
          const PJT_DUR = grid.getValue(cell.index.itemIndex, 'PJT_DUR');
          const VEND_DIV = grid.getValue(cell.index.itemIndex, 'VEND_DIV');
          const DAN_DIV = grid.getValue(cell.index.itemIndex, 'DAN_DIV');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          
          if (rowState === 'created' || VEND_DIV == 'Y') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else if (rowState !== 'created' && DAN_DIV == 'Y' && PJT_DUR>=30) {
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #008000; padding:4px 12px; min-width:80px"
                  >첨부 완료</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding:4px 12px; min-width:80px"
                  >첨부</button> 
                </div>
              `;
            }
          }
          else
          {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          }
        }
      }
    },
    {
      fieldName: 'PJT_DESC', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('공사내용') }, editable: false, editable: false,
      styleCallback: function (grid, dataCell) { 
        var ret = {}
        const itemIndex = dataCell.index.itemIndex;
        const rowState = grid.getDataSource().getRowState(itemIndex);
        const VEND_DIV = grid.getValue(itemIndex, 'VEND_DIV')
        const DAN_DIV = grid.getValue(itemIndex, 'DAN_DIV')
 
        if (VEND_DIV == 'Y') {
          ret.editable = false
          ret.style = { background: '#FFFFFF' }
        } else if (DAN_DIV == 'Y') { 
          ret.editable = true
          ret.style = { background: '#eff8fd' }
        }
  
        return ret;
      }
    },
    {
      fieldName: 'PJT_START', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', width: '120', styleName: 'center-column',
      header: { text: t('착수') }, editable: false,
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      styleCallback: function (grid, dataCell) { 
        var ret = {}
        const itemIndex = dataCell.index.itemIndex;
        const rowState = grid.getDataSource().getRowState(itemIndex);
        const VEND_DIV = grid.getValue(itemIndex, 'VEND_DIV')
        const DAN_DIV = grid.getValue(itemIndex, 'DAN_DIV')
 
        if (VEND_DIV == 'Y') {
          ret.editable = false
          ret.style = { background: '#FFFFFF' }
        } else if (DAN_DIV == 'Y') { 
          ret.editable = true
          ret.style = { background: '#eff8fd' }
        }
  
        return ret;
      }
    },
    {
      fieldName: 'PJT_END', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', width: '120', styleName: 'center-column',
      header: { text: t('완료') }, editable: false,
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      styleCallback: function (grid, dataCell) { 
        var ret = {}
        const itemIndex = dataCell.index.itemIndex;
        const rowState = grid.getDataSource().getRowState(itemIndex);
        const VEND_DIV = grid.getValue(itemIndex, 'VEND_DIV')
        const DAN_DIV = grid.getValue(itemIndex, 'DAN_DIV')
 
        if (VEND_DIV == 'Y') {
          ret.editable = false
          ret.style = { background: '#FFFFFF' }
        } else if (DAN_DIV == 'Y') { 
          ret.editable = true
          ret.style = { background: '#eff8fd' }
        }
  
        return ret;
      }
    },
    {
      fieldName: 'PJT_DUR', dataType: 'text', width: '120', styleName: 'right-column',
      header: { text: t('일수') }, 
    },
    {
      fieldName: 'REMARK', dataType: 'text', width: '300', styleName: 'editable_column left-column',
      header: { text: t('비고') }, 
    },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false, },
    { fieldName: 'VEND_FLAG', dataType: 'text', visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', visible: false, },
    { fieldName: 'YEAR', dataType: 'text', visible: false, },
    { fieldName: 'SEQ', dataType: 'text', visible: false, },
    // FILE_COUNT
    { fieldName: 'VEND_COUNT', dataType: 'number', visible: false },
    { fieldName: 'SAFE_COUNT', dataType: 'number', visible: false },
    { fieldName: 'IN_VEND_COUNT', dataType: 'number', visible: false },
    { fieldName: 'EVAL_RES_COUNT', dataType: 'number', visible: false },
    { fieldName: 'EVAL_DATA_COUNT', dataType: 'number', visible: false },
    { fieldName: 'SHORT_COUNT', dataType: 'number', visible: false },
    { fieldName: 'SHORT_OSHC_COUNT', dataType: 'number', visible: false },
  ],
  columns : [],
  columnLayout :[
    'BSNS_CD',
    'DEPT_CD',
    {
      name:'구분',
      direction: 'horizontal',
      items: ['VEND_DIV', 'DAN_DIV'],
      header: {text : t('구분')}
    },
    'VEND_NM',
    {
      name:'공사기간',
      direction: 'horizontal',
      items:['PJT_START', 'PJT_END','PJT_DUR'],
      header: {text : t('공사기간')}
    },
    'VEND_DATA',
    {
      name:'사내 협력사',
      direction: 'horizontal',
      items: [
        'SAFE_PLAN',
        'IN_VEND_EVAL',
        'SAFE_STD_EVAL',
        'SAFE_CHECK',
        {
          name:'협력사 안전보건협의회',
          direction: 'horizontal',
          items:['MINUTES', 'A', 'B'],
          header: {text : t('협력사 안전보건협의회')}
        }
      ],
      header: {text : t('사내 협력사')}
    },
    {
      name:'단기공사',
      direction: 'horizontal',
      items: [
        {
          name:'[계약전]\n적격수급업체 평가',
          direction: 'horizontal',
          items:['EVAL_RES', 'EVAL_DATA'],
          header: {text : t('[계약전]\n적격수급업체 평가')}
        },
        'SHORT_PJT_SAFE_EVAL',
        'SHORT_PJT_OSHC_EVAL',
        'PJT_DESC',

      ],
      header: {text : t('단기공사')}
    },
    'REMARK'
  ]
})

grd1Props.columns = grd1Props.fields

// 파일첨부 팝업
const onCellItemClicked = (grid, index, col) => {
  const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.column === 'VEND_DATA') {
    if (col.target.className === 'v-btn a') {
      selectedRow.value = index.dataRow
      sppfg0010Popup.value.openPopup(data)
    } else if (col.target.className === 'v-btn b' && data.VEND_FLAG != null) {
      vendDataTitle.value = '도급업체 자료 파일첨부'
      selectedRow.value = index.dataRow
      vendDataPopup.value.openPopup(data.VEND_DATA)
    }
    // else if (col.target.className === 'v-btn b' && data.VEND_FLAG == 'Y') { 
    //   vendDataTitle.value = '도급업체 자료 파일첨부'
    //   selectedRow.value = index.dataRow
    //   confirmVendPopup.value.openPopup(data.VEND_DATA)
    // }
  } else if (col.column === 'SAFE_PLAN') {
    if (col.target.className === 'v-btn') {
      if (data.VEND_DIV == 'Y' && data.DAN_DIV) {
        safePlanTitle.value = '안전관리 계획서 파일첨부'
        selectedRow.value = index.dataRow
        safePlanPopup.value.openPopup(data.SAFE_PLAN)
      }
    }
  } else if (col.column === 'IN_VEND_EVAL') {
    if (col.target.className === 'v-btn') {
      if (data.VEND_DIV == 'Y' && data.DAN_DIV) {
        inVendEvalTitle.value = '사내협력사 심의위원회평가 파일첨부'
        selectedRow.value = index.dataRow
        inVendEvalPopup.value.openPopup(data.IN_VEND_EVAL)
      }
    }
  } else if (col.column === 'SAFE_STD_EVAL') {
    if (col.target.className === 'v-btn') {
      if (data.VEND_DIV == 'Y' && data.DAN_DIV) { 
        router.push({ path: '/30_safety/SAF_I/SAFIB0020' })
      }
    }
  } else if (col.column === 'SAFE_CHECK') {
    if (col.target.className === 'v-btn') {
      if (data.VEND_DIV == 'Y' && data.DAN_DIV) { 
        router.push({ path: '/30_safety/SAF_I/SAFIG0010' })
      }
    }
  } else if (col.column === 'MINUTES') {
    if (col.target.className === 'v-btn') {
      if (data.VEND_DIV == 'Y' && data.DAN_DIV) { 
        router.push({ path: '/30_safety/SAF_I/SAFIF0010' })
      }
    }
  } else if (col.column === 'EVAL_RES') {
    if (col.target.className === 'v-btn') {
      if (data.DAN_DIV == 'Y' && data.VEND_DIV) {
        evalResTitle.value = '평가 결과 파일첨부'
        selectedRow.value = index.dataRow
        evalResPopup.value.openPopup(data.EVAL_RES)
      }
    }
  } else if (col.column === 'EVAL_DATA') {
    if (col.target.className === 'v-btn') {
      if (data.DAN_DIV == 'Y' && data.VEND_DIV) {
        evalDataTitle.value = '평가 자료 파일첨부'
        selectedRow.value = index.dataRow
        evalDataPopup.value.openPopup(data.EVAL_DATA)
      }
    }
  } else if (col.column === 'SHORT_PJT_SAFE_EVAL') {
    if (col.target.className === 'v-btn') {
      if (data.DAN_DIV == 'Y' && data.VEND_DIV) {
        shortPjtSafeEvalTitle.value = '단기공사 안전보건평가 파일첨부'
        selectedRow.value = index.dataRow
        shortPjtSafeEvalPopup.value.openPopup(data.SHORT_PJT_SAFE_EVAL)
      }
    }
  } else if (col.column === 'SHORT_PJT_OSHC_EVAL') {
    if (col.target.className === 'v-btn') {
      if (data.DAN_DIV == 'Y' && data.VEND_DIV && data.PJT_DUR >= 30) {
        shortPjtOshcEvalTitle.value = '단기공사 안전보건협의회'
        selectedRow.value = index.dataRow
        console.log("data:",data)
        console.log("data.SHORT_PJT_OSHC_EVAL:",data.SHORT_PJT_OSHC_EVAL)
        shortPjtOshcEvalPopup.value.openPopup(data.SHORT_PJT_OSHC_EVAL)
      }
    }
  }  
}

const onCellEdited = (grid, itemIndex, dataRow, field) => {
  const dataProvider = grdMain.value.getDataProvider();
  const fieldName = grid.getColumn(field).fieldName
  const rowState = dataProvider.getRowState(dataRow); // 'created', 'updated', 'none' 등

   // 체크박스 컬럼
  const VEND_DIV = 'VEND_DIV';
  const DAN_DIV = 'DAN_DIV';

  const vendValue = dataProvider.getValue(itemIndex, VEND_DIV);
  const danValue = dataProvider.getValue(itemIndex, DAN_DIV);

  if (rowState == 'created') {
    // 둘중 하나만 Y 될수 있게함
    if (fieldName == VEND_DIV && vendValue == 'Y') {
      dataProvider.setValue(dataRow, DAN_DIV, 'N');
    } else if (fieldName == DAN_DIV && danValue == 'Y') {
      dataProvider.setValue(dataRow, VEND_DIV, 'N');
    }
  } 

  // 체크 후 다시 Y체크
  // const isVend = dataProvider.getValue(dataRow, VEND_DIV) == 'Y';
  // const isDan = dataProvider.getValue(dataRow, DAN_DIV) == 'Y';

  // updateReadonlyState(dataRow, isVend, isDan, rowState);
}

// 수정불가처리
const updateReadonlyState = (rowIndex, isVend, isDan, rowState) => {

  // // 사내 협력사 수정불가, 신규일때도 수정불가
  // if (rowState !== 'created') { 
  //   grdMain.value.getGridView().setColumnProperty('SAFE_PLAN', 'editable', isVend)
  //   grdMain.value.getGridView().setColumnProperty('IN_VEND_EVAL', 'editable', isVend)
  //   grdMain.value.getGridView().setColumnProperty('SAFE_STD_EVAL', 'editable', isVend)
  //   grdMain.value.getGridView().setColumnProperty('SAFE_CHECK', 'editable', isVend)
  //   grdMain.value.getGridView().setColumnProperty('MINUTES', 'editable', isVend)
  //   grdMain.value.getGridView().setColumnProperty('A', 'editable', isVend)
  //   grdMain.value.getGridView().setColumnProperty('B', 'editable', isVend)

  //   // 사내 협력사 컬럼색상
  //   grdMain.value.getGridView().setColumnProperty('SAFE_PLAN', 'styleName', isVend ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('IN_VEND_EVAL', 'styleName', isVend ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('SAFE_STD_EVAL', 'styleName', isVend ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('SAFE_CHECK', 'styleName', isVend ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('MINUTES', 'styleName', isVend ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('A', 'styleName', isVend ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('B', 'styleName', isVend ? 'editable_column center-column' : 'center-column')

  //   // 단기공사 수정불가, 신규일때도 수정불가
  //   grdMain.value.getGridView().setColumnProperty('EVAL_RES', 'editable', isDan)
  //   grdMain.value.getGridView().setColumnProperty('EVAL_DATA', 'editable', isDan)
  //   grdMain.value.getGridView().setColumnProperty('SHORT_PJT_SAFE_EVAL', 'editable', isDan)

  //   // 단기공사 컬럼색상
  //   grdMain.value.getGridView().setColumnProperty('EVAL_RES', 'styleName', isDan ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('EVAL_DATA', 'styleName', isDan ? 'editable_column center-column' : 'center-column')
  //   grdMain.value.getGridView().setColumnProperty('SHORT_PJT_SAFE_EVAL', 'styleName', isDan ? 'editable_column center-column' : 'center-column')
  // }

  // // 사내협력사 선택하면 단기공사 수정값 초기화
  // if (isVend) { 
  //   grdMain.value.getDataProvider().setValue(rowIndex,'PJT_DESC','')
  //   grdMain.value.getDataProvider().setValue(rowIndex,'PJT_START','')
  //   grdMain.value.getDataProvider().setValue(rowIndex,'PJT_END','')
  // }
  // // 얘네는 신규일때도 수정되어야함
  // grdMain.value.getGridView().setColumnProperty('PJT_DESC', 'editable', isDan)
  // grdMain.value.getGridView().setColumnProperty('PJT_START', 'editable', isDan)
  // grdMain.value.getGridView().setColumnProperty('PJT_END', 'editable', isDan)
  // grdMain.value.getGridView().setColumnProperty('PJT_DESC', 'styleName', isDan ? 'editable_column left-column' : 'left-column')
  // grdMain.value.getGridView().setColumnProperty('PJT_START', 'styleName', isDan ? 'editable_column center-column' : 'center-column')
  // grdMain.value.getGridView().setColumnProperty('PJT_END', 'styleName', isDan ? 'editable_column center-column' : 'center-column')
}

// 파일 업로드 팝업
const uploadVendData = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    VEND_DATA: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_04', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}
const uploadSafePlan = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    SAFE_PLAN: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_05', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}
const uploadInVendEval = (val) => { 
  let saveParams = []
  
  if (val.fileId == null) return
  
  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    IN_VEND_EVAL: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_06', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

const uploadEvalRes = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    EVAL_RES: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_07', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

const uploadEvalData = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    EVAL_DATA: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_08', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

const uploadShortPjtSafeEval = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    SHORT_PJT_SAFE_EVAL: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_09', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

const uploadShortPjtOshcEval = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    SHORT_PJT_OSHC_EVAL: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFG0010_SAVE_10', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}
const upData = () => {
  selectedRow.value = null;
  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().commit(); // 변경사항 커밋
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    if (searchParams.BSNS_CD == '') {
      Message.warn(t('사업부를 선택해주세요.'))
      return
    } else if (searchParams.DEPT_CD == '') {
      Message.warn(t('부서를 선택해주세요.'))
      return
    }
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      BSNS_CD: searchParams.BSNS_CD || '',
      DEPT_CD: searchParams.DEPT_CD || '',
      VEND_DIV: 'N',
      DAN_DIV: 'N',
      VEND_NM: '',
      VEND_DATA: '',
      SAFE_PLAN: '',
      IN_VEND_EVAL: '',
      EVAL_RES: '',
      EVAL_DATA: '',
      SHORT_PJT_SAFE_EVAL: '',
      PJT_DESC: '',
      PJT_START: '',
      PJT_END: '',
      REMARK: '',
      SAVE_YN: 'N',
      VEND_FLAG: 'N'
    }, false)
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


const getData = (val) => {

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  
  return commonSearchApi({ queryId: 'SPPFG0010_SEARCH_01', param: searchParams })  
}

// 조회 후
const afterSearch = (res) => {
  let result = []
  if(res.ORESULT_CUR.length>0)
  { 
    for(const d of res.ORESULT_CUR)
    {
      let a = {...d};
      let start = dayjs(d.PJT_START,'YYYY-MM-DD', true)
      let end = dayjs(d.PJT_END,'YYYY-MM-DD', true)
      
      if(start.isValid() && end.isValid())
      {
        a.PJT_DUR= end.diff(start,'day');
      }

      result.push(a)
    }
  }
  
  grdMain.value.getDataProvider().setRows(result);
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
    if (data.VEND_DIV == 'N' && data.DAN_DIV == 'N') {
      return Message.warn(t('구분은 필수 체크입니다.'))
    } else if (isEmpty(data.VEND_NM)) {
      return Message.warn(t('협력사명은 필수 입력입니다.'))
    } else if (data.DAN_DIV == 'Y' && !data.PJT_START) { 
      return Message.warn(t('착수일은 필수 입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (data.VEND_DIV === 'Y') {
      data.YEAR = searchParams.YEAR
    } else if (data.DAN_DIV === 'Y') {
      data.YEAR = data.PJT_START?.substring(0, 4) || ''
    }

    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPFG0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch','btnCreate','btnUpdate']"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-4 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <div class="d-flex align-center" style="margin-right: 16px;">
              <v-radio-group
                v-model="searchParams.USER_DIV"
                class="d-flex align-center"
                density="compact"
                hide-details
                inline
              >
                <v-radio label="전체" value=""></v-radio>
                <v-radio label="사내협력사" value="B"></v-radio>
                <v-radio label="단기공사" value="D"></v-radio>
              </v-radio-group>
            </div>
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              label-width="30px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="150px"
              class="ml-3"
            />

            <i-select
              :label="$t('사업부')"
              width="250px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            
            <i-select
              :label="$t('부서')"
              width="250px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :readonly="isEmpty(searchParams.BSNS_CD)"
            />
          </div>
        </v-sheet>
        <RealGrid
          ref="grdMain"
          :grid-view-option="grd1Props.gridViewOption"
          :keys="grd1Props.keys" 
          :fields="grd1Props.fields"
          :columns="grd1Props.columns"
          :column-layout="grd1Props.columnLayout"
          @onCellEdited="onCellEdited"
          @onCellItemClicked="onCellItemClicked"
        />
      </div>
    </v-card-text>
  </v-card>
  <SPPFG0010Popup ref="sppfg0010Popup" @upData="upData"/>
  <IUploadPopup ref="vendDataPopup" :gridTitle="vendDataTitle" @uploaded="uploadVendData" :pdfOnly="true" @closed="filePopupClosed"/>
  <!-- <IUploadPopup ref="confirmVendPopup" :gridTitle="vendDataTitle" :isVisibled="false" :buttonList="['btnDownLoad','btnClose']"/> -->
  <IUploadPopup ref="safePlanPopup" :gridTitle="safePlanTitle" @uploaded="uploadSafePlan" @closed="filePopupClosed"/>
  <IUploadPopup ref="inVendEvalPopup" :gridTitle="inVendEvalTitle" @uploaded="uploadInVendEval" @closed="filePopupClosed"/>  
  <IUploadPopup ref="evalResPopup" :gridTitle="evalResTitle" @uploaded="uploadEvalRes" @closed="filePopupClosed"/>  
  <IUploadPopup ref="evalDataPopup" :gridTitle="evalDataTitle" @uploaded="uploadEvalData" @closed="filePopupClosed"/>  
  <IUploadPopup ref="shortPjtSafeEvalPopup" :gridTitle="shortPjtSafeEvalTitle" @uploaded="uploadShortPjtSafeEval" @closed="filePopupClosed"/>  
  <IUploadPopup ref="shortPjtOshcEvalPopup" :gridTitle="shortPjtOshcEvalTitle" @uploaded="uploadShortPjtOshcEval" @closed="filePopupClosed"/>  
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
::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>
