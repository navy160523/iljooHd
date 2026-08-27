<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업  > 산재사고 재발방지대책 이행점검   -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
// 팝업
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import IUpload from '@/components/IUpload.vue'

import dayjs from 'dayjs'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'

import Message from '@hiway/utils/notify'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SAFAB0020PopUp from '@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue'

defineOptions({
  name: '30_safety-SAF_A-SAFAB0020',
})
const CausePopup = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const Popdata = reactive({})
const grdMain = ref(null)
const grdDetail = ref(null)
// 팝업관련
const deptPopup = ref(null)
const locationPopup = ref(null)
const empPopup = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(['close', 'upData'])

const fileIndex = ref('')
const fileData = ref('')

const Imp = ref({})
const GridTitle1 = ref(null)
const GridTitle2 = ref(null)

const SagoInfo = ref(null)
const sagoEmpNo = 'A524835'                     // 사고 담당자 지정  (김성일 매니저: A524835)
const sagoEmp_Email  = 'seongil97@hd.com'       // 사고 담당자 Email (김성일 매니저: seongil97@hd.com)

const sagoEmpNo2 = 'A523481'                    // 사고 담당자 지정  (강현웅 선임  : A523481)
const sagoEmp_Email2 = 'hyeonung.kang@hd.com'   // 사고 담당자 Email (강현웅 선임: hyeonung.kang@hd.com)

const props = defineProps({
  popupParam: {
    type: Object,
    required: false,
    default() {
      return {}
    },
  },
})

const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

onMounted(async () => {
  for (let i in props.popupParam) {
    Popdata[i] = props.popupParam[i]
  }

  console.log(Popdata, 'Popdata')
  await ImpSearch()

  if (Popdata.passPort == 'Y') {
    menuTitle.value.disableBtn('btnCompleteSAF', true)
    menuTitle.value.disableBtn('btnCancelWrite', true)
    menuTitle.value.disableBtn('btnBsmgrConfirm', true)
    GridTitle1.value.disableBtn('btnUpdate', true)
    GridTitle1.value.disableBtn('btnDelete', true)
    GridTitle2.value.disableBtn('btnCreate', true)
    GridTitle2.value.disableBtn('btnUpdate', true)
    GridTitle2.value.disableBtn('btnDelete', true)
  }

    // 사고 모듈 관리자, 즉보에서 저장된 담당 안전과장 버튼 보임 나머지 숨김처리
    if (userStore.authGrpCd.includes('SAFAA001') || 
      userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2 ||
      userStore.empNo === Popdata.SAFE_GAMGR_EMP){

      menuTitle.value.visibleBtn('btnBsmgrConfirmCancel', true)

      // 안전확인 취소는 사고 담당자만 보이도록
      if (userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2){
        menuTitle.value.visibleBtn('btnSafetyCancel', true)
      }
    }else{
      menuTitle.value.visibleBtn('btnBsmgrConfirmCancel', false)
    }
})

const ImpSearch = () => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  }
  commonSearchApi({
    queryId: 'SAFAB0020_search13',
    param: param,
  }).then((res) => {
    console.log(res.ORESULT_CUR)
    if (res.ORESULT_CUR.length != 0) {
      Imp.value = res.ORESULT_CUR[0]
      if (Imp.value.CHK_DT) {
        Imp.value.CHK_DT = dayjs(Imp.value.CHK_DT).format('YYYY-MM-DD')
      }

      SagoInfo.value = 
        '일시 : ' + dayjs(Popdata.OCCUR_DT).format('YYYY') + '년 ' + dayjs(Popdata.OCCUR_DT).format('MM') + '월 ' + dayjs(Popdata.OCCUR_DT).format('DD') + '일 ' + '<br>'+
        '재해부서 : ' + Popdata.INJR_DEPT_NM + '<br>'+
        '재해자 : ' + Imp.value.INGR_NAME + '<br>'+
        '사고구분 : ' + Popdata.SAGO_TYPE_NM

    } else {
      // Imp.value = {}
      Imp.value.COMP_DT = null
    }
  })
  commonSearchApi({
    queryId: 'SAFAB0020_search14',
    param: param,
  }).then((res) => {
    console.log(res, 'res')
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const onButtonsClick = (btn, gub) => {
  if (gub === '메인') {
    // 작성완료
    if (btn == 'btnCompleteSAF') {
      CompleteSend()
    }
    // 작성완료 취소
    if (btn == 'btnCancelWrite') {
      CancelWrite()
    }
    // 부서장 확인
    if (btn == 'btnBsmgrConfirm') {
      BsmgrCheck()
    }
    // 부서장 확인취소
    if (btn == 'btnBsmgrConfirmCancel') {
      BsmgrCheckCancel()
    }
    // 안전 확인
    if (btn == 'btnSafetyCheck') {
      SafetyCheck()
    }

    // 안전 확인 취소
    if (btn == 'btnSafetyCancel') {
      SafetyCheckCancel()
    }
  }

  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(ImpCheck)
      .setQuery(ImpsaveData)
      .setAfter(() => ImpSearch())
      .run()
  }
  if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(ImpCheck)
      .setQuery(ImpDelData)
      .setAfter(() => ImpSearch())
      .run()
  }

  if (gub === '그리드') {
    if (btn === 'btnCreate') {
      let newRow = {
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
        SAGO_CAUSE: '',
        PRVNT_MSRS: '',
        OK_YN: 'N',
        CHK_OPINION: '',
      }

      grdMain.value.addRow(newRow)
    }
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setBefore(grdCheck)
        .setQuery(grdSaveData)
        .setAfter(() => ImpSearch())
        .run()
    }
    if (btn === 'btnDelete') {
      new deleteFlowHelper(vm, t)
        .setBefore(grdCheck)
        .setQuery(grdDelData)
        .setAfter(() => ImpSearch())
        .run()
    }
  }
}

// 메인 작성완료
const CompleteSend = () => {
  if (ImpCheck()) {
    vm.$swal({
      title: t(
        '작성완료 요청 하시겠습니까? <br> ※주의 <br> 책임부서 부서장에게 메일이 발송된 후 더이상 수정이 불가합니다.'
      ),
      showCancelButton: true,
    }).then((swalRes) => {
      if (swalRes.isConfirmed === true) {
        if (Imp.value.COMP_DT) {
          return Message.warn(t('이미 작성완료 된 사안입니다.'))
        }

        let saveParams = []

        saveParams.push({
          CMPNY_DIV: Popdata.CMPNY_DIV,
          SAGO_SN: Popdata.SAGO_SN,
        })
        
        // 저장 
        if (!Popdata.RESP_BSMGR_NM_EMAIL) {
          console.log(Imp, "IMp")
          // return Message.warn(
          //   t("등록된 책임부서장 메일이 없습니다 확인부탁드립니다.")
          // )
          Message.warn(t("등록된 책임부서장 메일이 없습니다. 책임부서 부서장 메일발송 없이 작성 완료 됩니다."))
        }

        ImpsaveData()
        grdSaveData()

        // 김성일 매니저 요청으로 책임부서 부서장 Email이 없는 경우에는 메일 발송 없이 작성 완료 처리 - 2024.12.11
        if (!Popdata.RESP_BSMGR_NM_EMAIL) {
          commonExecuteApi({
            queryId: 'SAFAB0020_save18',
            list: saveParams,
          }).then((res) => {
            ImpSearch()
          })
          
        } else{
          // 메일 발송
          mailParams.EMAIL = [Popdata.RESP_BSMGR_NM_EMAIL]
          mailParams.SUBJECT = '산재사고 재발방지대책 이행점검 작성완료건'
          mailParams.CONTENT = SagoInfo.value + '<br><br> 사고에 대한 재발방지대책 이행점검이 작성 완료되었습니다. 재발방지대책 이행점검 부서장 확인 바랍니다.'
          commonSendApi(mailParams)
            .then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
              commonExecuteApi({
                queryId: 'SAFAB0020_save18',
                list: saveParams,
              })
            })
            .catch((err) => {
              console.log(err, 'err')
            })
            .finally((err) => {
              ImpSearch()
            })
        }
      }
    })
  } else {
    return
  }
}

// 작성취소
const CancelWrite = () => {
  vm.$swal({
    title: t('작성완료 취소 요청 하시겠습니까? '),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Imp.value.COMP_DT) {
        return Message.warn(t('이미 작성취소 된 사안입니다.'))
      }

      let saveParams = []

      saveParams.push({
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
      })

      commonExecuteApi({
        queryId: 'SAFAB0020_save19',
        list: saveParams,
      }).then((res) => {
        console.log('hi')
        ImpSearch()
      })
    }
  })
}

// 부서장확인
const BsmgrCheck = () => {
  vm.$swal({
    title: t('부서장확인 하시겠습니까?'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (Imp.value.BSMGR_DT) {
        return Message.warn(t('이미 부서장확인 된 사안입니다.'))
      }

      let saveParams = []

      saveParams.push({
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
      })

      if (!Popdata.SAFE_GAMGR_EMPEMAIL) {
        return Message.warn(
          t('등록된 부서장 메일이 없습니다 확인부탁드립니다.')
        )
      }
      console.log(mailParams, 'mailParams')
      // 메일 발송
      mailParams.EMAIL = [Popdata.SAFE_GAMGR_EMPEMAIL]
      mailParams.SUBJECT = '산재사고 재발방지대책 이행점검 작성완료건'
      mailParams.CONTENT = SagoInfo.value + '<br><br> 사고에 대한 재발방지대책 이행점검 부서장 확인 되었습니다. 재발방지대책 이행점검 안전 확인 바랍니다.'
      
      commonSendApi(mailParams)
        .then((res) => {
          Message.success(t('메일이 전송되었습니다.'))
          commonExecuteApi({
            queryId: 'SAFAB0020_save20',
            list: saveParams,
          }).then((res) => {
            console.log('hi')
            ImpSearch()
          })
        })
        .catch((err) => {
          console.log(err, 'err')
        })
    }
  })
}

const BsmgrCheckCancel = () => {
  vm.$swal({
    title: t('부서장확인 취소 하시겠습니까?'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {

      let saveParams = []

      saveParams.push({
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
      })

      commonExecuteApi({
        queryId: 'SAFAB0020_save32',
        list: saveParams,
      }).then((res) => {
        ImpSearch()
      })

    }
  })
}

// 안전확인
const SafetyCheck = () => {
  vm.$swal({
    title: t('안전확인 하시겠습니까?'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (Imp.value.SAFE_CHK_DT) {
        return Message.warn(t('이미 안전확인 된 사안입니다.'))
      }

      let saveParams = []

      saveParams.push({
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
      })
      
      console.log(mailParams, 'mailParams')
      // 메일 발송
      mailParams.EMAIL = [sagoEmp_Email]
      mailParams.SUBJECT = '산재사고 재발방지대책 이행점검 작성완료건'
      mailParams.CONTENT = SagoInfo.value + '<br><br> 사고에 대한 재발방지대책 이행점검 안전 확인 완료되었습니다.'

      commonSendApi(mailParams).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
        commonExecuteApi({
          queryId: 'SAFAB0020_save21',
          list: saveParams,
        }).then((res) => {
          console.log('hi')
          ImpSearch()
        })
      })
      .catch((err) => {
        console.log(err, 'err')
      })
    }
  })
}

const SafetyCheckCancel = () => {
  vm.$swal({
    title: t('안전확인 취소 하시겠습니까?'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      let saveParams = []

      saveParams.push({
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
      })

      commonExecuteApi({
        queryId: 'SAFAB0020_save33',
        list: saveParams,
      }).then((res) => {
        console.log('hi')
        ImpSearch()
      })

    }
  })
}


// 저장 사고개요
const ImpCheck = () => {
  if (!Imp.value.CHK_DEPT_NM) {
    Message.warn(t('책임부서는 필수입력입니다.'))
    return false
  }
  if (!Imp.value.CHK_EMPKOM) {
    Message.warn(t('점검 담당자는 필수입력입니다'))
    return false
  }
  if (!Imp.value.CHK_DT) {
    Message.warn(t('점검일자는 필수입력입니다.'))
    return false
  }
  if (!Imp.value.CHK_LOC_LM) {
    Message.warn(t('점검구역은 필수입력입니다.'))
    return false
  }

  let cnt = 0 

  /* 그리드 확인 */

  // 사고원인
  cnt = (grdMain.value.getDataProvider().getJsonRows()).filter(data => isNullCheck(data.SAGO_CAUSE)).length
  if (cnt > 0) {
    Message.warn(t('사고원인은 필수 입력입니다. 사고원인을 입력해 주세요'))
    return false
  }

  // 재발방지 대책
  cnt = (grdMain.value.getDataProvider().getJsonRows()).filter(data => isNullCheck(data.PRVNT_MSRS)).length
  if (cnt > 0) {
    Message.warn(t('재발방지 대책은 필수 입력입니다. 재발방지 대책을 입력해 주세요'))
    return false
  }

  // 양호/미흡
  cnt = (grdMain.value.getDataProvider().getJsonRows()).filter(data => data.OK_YN === 'N').length
  if (cnt > 0 && !Imp.value.IMPRV_PLAN) {
    Message.warn(t('점검 결과 중 미흡으로 선택된 점검이 있습니다. 이행 개선 계획을 작성해 주세요.'))
    return false
  }
  
  // 사진1 & 사진2
  cnt = (grdMain.value.getDataProvider().getJsonRows()).filter(data => data.FILE_1_COUNT === '-1' && data.FILE_2_COUNT === '-1').length
  if (cnt > 0) {
    Message.warn(t('사고 원인 1건당 1개이상 점검 사진을 업로드하여야 합니다.'))
    return false
  }

  return true
}

const ImpsaveData = () => {
  let saveParam = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      CHK_DEPT_CD: Imp.value.CHK_DEPT_CD,
      CHK_EMP: Imp.value.CHK_EMP,
      CHK_DT: Imp.value.CHK_DT.replace(/-/g, ''),
      CHK_LOC_L: Imp.value.CHK_LOC_L,
      CHK_LOC_M: Imp.value.CHK_LOC_M,
      CHK_LOC_S: Imp.value.CHK_LOC_S,
      CHK_LOC_DTL: Imp.value.CHK_LOC_DTL,
      IMPRV_PLAN: Imp.value.IMPRV_PLAN,
    },
  ]

  return commonExecuteApi({ queryId: 'SAFAB0020_save10', list: saveParam })
}

// 삭제 사고개요
const ImpDelData = () => {
  let DelParams = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
    },
  ]

  return commonExecuteApi({ queryId: 'SAFAB0020_delete08', list: DelParams })
}

// 그리드 저장 S: SAVE, C:
const grdCheck = () => {
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  let flag = true
  
  if (checkedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    flag = false
  }
  
  // 그리드만 저장 되기 때문에 이행 개선계획 체크 X

  // let cnt = (grdMain.value.getDataProvider().getJsonRows()).filter(data => data.OK_YN === 'N').length
  // if (cnt > 0 && !Imp.value.IMPRV_PLAN) {
  //   Message.warn(t('점검 결과 중 미흡으로 선택된 점검이 있습니다. 이행 개선 계획을 작성해 주세요.'))
  //   return false
  // }

  /* 작성완료시 전부 확인 */ 
  // checkedRow.forEach((val) => {
  //   let data = grdMain.value.getDataProvider().getJsonRow(val)
    
  //   if (isNullCheck(data.OK_YN)){
  //     Message.warn(t('양호/미흡 선택은 필수입니다.'))
  //     flag = false
  //     return
  //   }

  //   if (isNullCheck(data.CHK_OPINION)){
  //     Message.warn(t('점검 의견은 필수 입력입니다.'))
  //     flag = false
  //     return
  //   }

  // })

  return flag
}
const grdSaveData = () => {
  let saveParams = []
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  checkedRow.forEach((val) => {
    let data = grdMain.value.getDataProvider().getJsonRow(val)
    saveParams.push(data)
  })

  console.log(saveParams, 'saveParams')

  return commonExecuteApi({ queryId: 'SAFAB0020_save11', list: saveParams })
}

// 그리드 삭제

const grdDelData = () => {
  let DelParams = []
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  checkedRow.forEach((val) => {
    let data = grdMain.value.getDataProvider().getJsonRow(val)
    DelParams.push(data)
  })
  return commonExecuteApi({ queryId: 'SAFAB0020_delete09', list: DelParams })
}

// 그리드

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'SAGO_CAUSE',
      dataType: 'text',
      header: { text: t('사고 원인') },
      styleName: 'left-column',
    },
    {
      fieldName: 'PRVNT_MSRS',
      dataType: 'text',
      header: { text: t('재발방지 대책') },
      styleName: 'left-column',
    },

    {
      fieldName: 'OK_YN',
      dataType: 'text',
      header: { text: t('양호/미흡') },
      editable: false,
      renderer: {
        type: 'html',
        callback: (grid, model, field) => {
          return GBNCallback(grid, model, field)
        },
      },
    },

    {
      fieldName: 'CHK_OPINION',
      dataType: 'text',
      header: { text: t('점검의견') },
      styleName: 'left-column',
    },

    {
      fieldName: 'FILE_ID1',
      dataType: 'text',
      editable: false,
      header: { text: t('사진1') },
      isFile: { value: true, align: 'right', showAlways: true },
      displayCallback: function (grd, idx, val) {
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

        return !data.FILE_TITLE1
          ? ''
          : data.FILE_TITLE1 +
              (data.FILE_1_COUNT > 0 ? ' 외 ' + data.FILE_1_COUNT + '건' : '')
      },
    },

    {
      fieldName: 'FILE_ID2',
      dataType: 'text',
      editable: false,
      header: { text: t('사진2') },
      isFile: { value: true, align: 'right', showAlways: true },
      displayCallback: function (grd, idx, val) {
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

        return !data.FILE_TITLE2
          ? ''
          : data.FILE_TITLE2 +
              (data.FILE_2_COUNT > 0 ? ' 외 ' + data.FILE_2_COUNT + '건' : '')
      },
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SAGO_SN', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'FILE_TITLE1', dataType: 'text', visible: false },
    { fieldName: 'FILE_TITLE2', dataType: 'text', visible: false },
    { fieldName: 'FILE_1_COUNT', dataType: 'text', visible: false },
    { fieldName: 'FILE_2_COUNT', dataType: 'text', visible: false },
  ],
  columnLayout: [
    'SAGO_CAUSE',
    'PRVNT_MSRS',

    {
      name: '점검내용',
      direction: 'horizontal',
      items: ['OK_YN', 'CHK_OPINION', 'FILE_ID1', 'FILE_ID2'],
      header: { text: t('점검내용') },
    },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

//  그리드 라이도

// grid radio 생성
const GBNCallback = (grid, model, field) => {
  let checkedY = ''
  let checkedN = ''
  
  if (model._index.value === 'Y') {
    checkedY = 'checked'
  } else {
    checkedN = 'checked'
  }

  return (
    "<input type='radio' " +
    "value='Y'" +
    'name=' +
    "'group" +
    model._index.dataRow +
    'G' +
    "' " +
    checkedY +
    ' />' +
    "<span style='padding: 0 10px 0 10px !important; margin-right: 20px;'>양호</span>" +
    "<input type='radio' " +
    "value='N'" +
    'name=' +
    "'group" +
    model._index.dataRow +
    'G' +
    "'" +
    checkedN +
    ' />' +
    "<span style='padding: 0 10px 0 10px !important;'>미흡</span>"
  )
}

// 부서 팝업
const deptPopupOpen = () => {
  deptPopup.value.openPopup()
}

const onDeptSelected = (row) => {
  console.log(row)
  Imp.value.CHK_DEPT_NM = row.ASGN_SHRT_NM
  Imp.value.CHK_DEPT_CD = row.DEPT_CD
}

// 점검 장소 팝업
const locationPopupOpen = () => {
  CausePopup.value.openPopup('장소')
}

const selectedLocation = (row) => {
  Imp.value.CHK_LOC_LM = row[0].TXT
  Imp.value.CHK_LOC_MM = row[1].TXT
  Imp.value.CHK_LOC_SM = row[2].TXT

  Imp.value.CHK_LOC_L = row[0].COD
  Imp.value.CHK_LOC_M = row[1].COD
  Imp.value.CHK_LOC_S = row[2].COD
}

// 인원 검색 팝업

const empPopupOpen = () => {
  empPopup.value.openPopup({ EMP_NM: Imp.value.CHK_EMPKOM })
}

const selectedEmpPopup = (row) => {
  Imp.value.CHK_EMPKOM = row.EMP_NM
  Imp.value.CHK_EMP = row.EMP_NO
  console.log(row)
}

//  파일 업로드
const onCellItemClicked = (grid, index, col) => {
  
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  if (data.SEQ){
    fileIndex.value = ''
    fileData.value = ''

    if (index.fieldName == 'FILE_ID1') {
      fileIndex.value = index.dataRow
      fileData.value = 'FILE_ID1'
      fileUpload.value.openPopup(data.FILE_ID1)
    }
    if (index.fieldName == 'FILE_ID2') {
      fileIndex.value = index.dataRow
      fileData.value = 'FILE_ID2'
      fileUpload.value.openPopup(data.FILE_ID2)
    }
    if (index.fieldName == 'OK_YN') {
      if (col.target.value === 'Y') {
        grdMain.value.getDataProvider().setValue(index.dataRow, 'OK_YN', 'Y')
      } else grdMain.value.getDataProvider().setValue(index.dataRow, 'OK_YN', 'N')

      // 라디오 변경시 수정 체크
      grdMain.value.getGridView().checkItem(index.itemIndex, true)
      grdMain.value.getGridView().commit()
    }
  }else{
    Message.warn('저장 후 사진 첨부하세요.')
  }
}

const uploaded = (val) => {
  console.log(val, 'dididi')
  if (fileData.value == 'FILE_ID1') {
    grdMain.value
      .getDataProvider()
      .setValue(fileIndex.value, 'FILE_ID1', val.fileId)
  }

  if (fileData.value == 'FILE_ID2') {
    grdMain.value
      .getDataProvider()
      .setValue(fileIndex.value, 'FILE_ID2', val.fileId)
  }

  // 파일 업로드 시 파일 키 저장 FILE2
  let data = grdMain.value.getDataProvider().getJsonRow(fileIndex.value)
  let saveParams = [{
    CMPNY_DIV : data.CMPNY_DIV,
    SAGO_SN : data.SAGO_SN,
    SEQ : data.SEQ,
    GBN : fileData.value === 'FILE_ID1' ? '1' : '2',
    FILE_ID : val.fileId,
    USER_ID : userStore.empNo,
  }]

  commonExecuteApi({
    queryId: 'SAFAB0020_save31',
    list: saveParams,
  })

  ImpSearch()
}

//널 체크 메서드
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

// 종결시 disable

watch(
  () => Imp.value.COMP_DT,
  (newValue) => {
    if (newValue) {
      menuTitle.value.disableBtn('btnCompleteSAF', true)
      menuTitle.value.disableBtn('btnCancelWrite', false)

      //// 재해 부서 부서장만 버튼 활성화 (사고 담당자도 활성화)
      //if (userStore.empNo === Popdata.RESP_BSMGR_NM || userStore.empNo === sagoEmpNo){
      //  menuTitle.value.disableBtn('btnBsmgrConfirm', false)
      //} else {
      //  menuTitle.value.disableBtn('btnBsmgrConfirm', true)
      //}
      
      // 2024.12.17 - 김성일 매니저 요청으로 부서장 확인 버튼 모든 인원에게 활성화
      menuTitle.value.disableBtn('btnBsmgrConfirm', false)
      menuTitle.value.disableBtn('btnBsmgrConfirmCancel', true)

      menuTitle.value.disableBtn('btnSafetyCheck', true)
      menuTitle.value.disableBtn('btnSafetyCancel', true)
      GridTitle1.value.disableBtn('btnUpdate', true)
      GridTitle1.value.disableBtn('btnDelete', true)
      GridTitle1.value.disableBtn('btnUpdate', true)
      GridTitle1.value.disableBtn('btnDelete', true)
      GridTitle2.value.disableBtn('btnCreate', true)
      GridTitle2.value.disableBtn('btnUpdate', true)
      GridTitle2.value.disableBtn('btnDelete', true)
    } else {
      menuTitle.value.disableBtn('btnCompleteSAF', false)
      menuTitle.value.disableBtn('btnCancelWrite', true)
      menuTitle.value.disableBtn('btnBsmgrConfirm', true)
      menuTitle.value.disableBtn('btnBsmgrConfirmCancel', true)
      menuTitle.value.disableBtn('btnSafetyCheck', true)
      menuTitle.value.disableBtn('btnSafetyCancel', true)
      GridTitle1.value.disableBtn('btnUpdate', false)
      GridTitle1.value.disableBtn('btnDelete', false)
      GridTitle1.value.disableBtn('btnUpdate', false)
      GridTitle1.value.disableBtn('btnDelete', false)
      GridTitle2.value.disableBtn('btnCreate', false)
      GridTitle2.value.disableBtn('btnUpdate', false)
      GridTitle2.value.disableBtn('btnDelete', false)
    }
  }
)
watch(
  () => Imp.value.BSMGR_DT,
  (newValue) => {
    if (newValue) {
      menuTitle.value.disableBtn('btnCompleteSAF', true)
      menuTitle.value.disableBtn('btnCancelWrite', true)
      menuTitle.value.disableBtn('btnBsmgrConfirm', true)
      // 사고 모듈 관리자, 즉보에서 저장된 담당 안전과장 활성화
      if (userStore.authGrpCd.includes('SAFAA001') || 
          userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2 ||
          userStore.empNo === Popdata.SAFE_GAMGR_EMP){
        menuTitle.value.disableBtn('btnBsmgrConfirmCancel', false)
        menuTitle.value.disableBtn('btnSafetyCheck', false)
      }
      GridTitle1.value.disableBtn('btnUpdate', true)
      GridTitle1.value.disableBtn('btnDelete', true)
      GridTitle1.value.disableBtn('btnUpdate', true)
      GridTitle1.value.disableBtn('btnDelete', true)
      GridTitle2.value.disableBtn('btnCreate', true)
      GridTitle2.value.disableBtn('btnUpdate', true)
      GridTitle2.value.disableBtn('btnDelete', true)
    }else{
      if (Imp.value.COMP_DT){
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', false)
        menuTitle.value.disableBtn('btnBsmgrConfirm', false)
        menuTitle.value.disableBtn('btnBsmgrConfirmCancel', true)
        menuTitle.value.disableBtn('btnSafetyCheck', true)
        GridTitle1.value.disableBtn('btnUpdate', true)
        GridTitle1.value.disableBtn('btnDelete', true)
        GridTitle1.value.disableBtn('btnUpdate', true)
        GridTitle1.value.disableBtn('btnDelete', true)
        GridTitle2.value.disableBtn('btnCreate', true)
        GridTitle2.value.disableBtn('btnUpdate', true)
        GridTitle2.value.disableBtn('btnDelete', true)
      }
    }
  }
)

watch(
  () => Imp.value.SAFE_CHK_DT,
  (newValue) => {
    if (newValue) {
      menuTitle.value.disableBtn('btnCompleteSAF', true)
      menuTitle.value.disableBtn('btnCancelWrite', true)
      menuTitle.value.disableBtn('btnBsmgrConfirm', true)
      menuTitle.value.disableBtn('btnBsmgrConfirmCancel', true)
      menuTitle.value.disableBtn('btnSafetyCheck', true)
      menuTitle.value.disableBtn('btnSafetyCancel', false)
      GridTitle1.value.disableBtn('btnUpdate', true)
      GridTitle1.value.disableBtn('btnDelete', true)
      GridTitle1.value.disableBtn('btnUpdate', true)
      GridTitle1.value.disableBtn('btnDelete', true)
      GridTitle2.value.disableBtn('btnCreate', true)
      GridTitle2.value.disableBtn('btnUpdate', true)
      GridTitle2.value.disableBtn('btnDelete', true)
    }else{
      if (Imp.value.BSMGR_DT){
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', true)
        menuTitle.value.disableBtn('btnBsmgrConfirm', true)
        menuTitle.value.disableBtn('btnBsmgrConfirmCancel', false)
        menuTitle.value.disableBtn('btnSafetyCheck', false)
        menuTitle.value.disableBtn('btnSafetyCancel', true)
        GridTitle1.value.disableBtn('btnUpdate', true)
        GridTitle1.value.disableBtn('btnDelete', true)
        GridTitle1.value.disableBtn('btnUpdate', true)
        GridTitle1.value.disableBtn('btnDelete', true)
        GridTitle2.value.disableBtn('btnCreate', true)
        GridTitle2.value.disableBtn('btnUpdate', true)
        GridTitle2.value.disableBtn('btnDelete', true)
      }
    }
  }
)
watch(
  () => Imp.value.CHK_DEPT_NM,
  (newValue) => {
    if (!newValue) {
      Imp.value.CHK_DEPT_CD = ''
    }
  }
)
</script>

<template>
  <v-card>
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :button-list="[
          'btnCompleteSAF',
          'btnCancelWrite',
          'btnBsmgrConfirm',
          'btnBsmgrConfirmCancel',
          'btnSafetyCheck',
          'btnSafetyCancel',
        ]"
        @click-button="onButtonsClick($event.id, '메인')"
      />
    </v-card-title>
    <!-- 인적사항 -->
    <v-card-text class="wrap">
      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle1"
            :title="$t('산재사고 재발방지대책 이행점검')"
            :button-list="['btnUpdate', 'btnDelete']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <!-- 부서 / 점검담당자 -->
            <div class="d-flex mb-3">
              <i-input
                top-label
                :label="$t('책임부서')"
                v-model="Imp.CHK_DEPT_NM"
                type="Text"
                width="200px"
                margin="10px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="deptPopupOpen()"
                required
              />
              <i-input
                top-label
                v-model="Imp.CHK_EMPKOM"
                :label="$t('점검 담당자')"
                type="Text"
                width="120px"
                margin="10px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="empPopupOpen()"
                required
              />
            </div>

            <!-- 점검일자/ 점검구역 -->
            <div class="d-flex align-center mb-3">
              <i-input
                top-label
                :label="$t('점검일자')"
                type="Date"
                width="150px"
                margin="10px"
                v-model="Imp.CHK_DT"
                required
              />

              <i-input
                top-label
                :label="$t('점검구역')"
                type="Text"
                width="150px"
                margin="10px"
                @click:appendInner="locationPopupOpen"
                append-inner-icon="mdi-magnify"
                readonly
                v-model="Imp.CHK_LOC_LM"
                required
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="150px"
                margin="10px"
                readonly
                v-model="Imp.CHK_LOC_MM"
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="150px"
                margin="10px"
                readonly
                v-model="Imp.CHK_LOC_SM"
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="300px"
                margin="10px"
                v-model="Imp.CHK_LOC_DTL"
              />
            </div>
            <!-- 그리드 -->

            <v-card-title class="mb-3">
              <IGridTitle
                ref="GridTitle2"
                :title="$t('')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onButtonsClick($event.id, '그리드')"
              >
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <RealGrid
              ref="grdMain"
              class="mb-3"
              style="height: 160px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
              @onCellItemClicked="onCellItemClicked"
            />
            <!-- 이행 개선계획 -->
            <div class="d-flex">
              <i-textarea
                label-width="300px"
                top-label
                :label="$t('이행 개선계획(점검내용에 미흡이 있는 경우 작성)')"
                v-model="Imp.IMPRV_PLAN"
                width="100%"
                required
              />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 팝업촌 -->
      <CommonCodePopUpSAF ref="CausePopup" @selected="selectedLocation" />
      <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
      <!-- <LocationPopup @selectedArr="selectedLocation" ref="locationPopup" /> -->
      <EmpPopup @selected="selectedEmpPopup" ref="empPopup" />
      <IUploadPopup ref="fileUpload" @uploaded="uploaded" />
      <!-- @selectedArr="selectedArr" -->
    </v-card-text>
  </v-card>
</template>

<style scoped>
.popUp-input-Form > div {
  margin: 10px 0;
}
.wrap {
  height: calc(100vh - 50px - 66.7px - 50px);
  overflow-y: scroll;
  padding: 0px;
}
</style>
