<!--
  화면명 : 아카데미 입소 대상 확정
  화면개요 : 아카데미 입소 대상자를 확정 또는 경감할 수 있는 화면.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EDUAC0010Popup from './EDUAC0010Popup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

defineOptions({
  name: '60_edu-EDU_A-EDUAC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const fileUploadPopup = ref(null)
const popupOpen = ref(null)

const readYn = ref(true)
const fieldName = ref(null)
const fieldIndex = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, // 사업부
  DEPT_CD: userStore.asgnCd, // 부서
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  STUS_YN: 'N', // 확정구분(N: 미 확정 , Y: 기 확정)
  CUTOFF_FROM: dayjs(new Date()).format('YYYY-MM-DD'),
  CUTOFF_TO: dayjs(new Date()).format('YYYY-MM-DD'),
  STUS_HELP: 'N', // 구제자
})

const saveParam = reactive([])

const buttonList = reactive(['btnDownLoad', 'btnClose'])

const mailParams = reactive({
  EMAIL: [],
  SUBJECT: '경고장',
  CONTENT: '',
})

const codeList = reactive({
  bsnsCd: [],
  deptCd: [],
  STUS_YNList: [
    { TXT: '미 확정자', COD: 'N' },
    { TXT: '기 확정자', COD: 'Y' },
  ],
  licStatus: [
    { TXT: '보유', COD: 'N' },
    { TXT: '보수교육임박', COD: 'Y' },
    { TXT: '정지', COD: 'O' },
    { TXT: '취소', COD: 'R' },
  ],
  IO_DIVList: [
    { value: '0', label: '등록' },
    { value: '1', label: '확정' },
    { value: '9', label: '경감' },
  ],
  EDU_DIVList: [
    { value: 'Y', label: '완료' },
    { value: 'N', label: '미완료' },
  ],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      header: { text: t('사업부') },
      width: '200',
      styleName: 'left-column',
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서') },
      width: '150',
      styleName: 'left-column',
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('소속') },
      width: '150',
    },
    { fieldName: 'NATN_CD', dataType: 'text', header: { text: t('국적') } },
    { fieldName: 'VIOLATOR', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'VIO_EMP_NO', dataType: 'text', header: { text: t('사번') } },
    {
      fieldName: 'HLD_OFFI_NM',
      dataType: 'text',
      header: { text: t('재직여부') },
    },
    {
      fieldName: 'WIBAN_CNT',
      dataType: 'text',
      header: { text: t('1년건수') },
    },
    {
      fieldName: 'STUS_CD',
      dataType: 'text',
      header: { text: t('상태') },
      lookupDisplay: true,
      lookupData: codeList.IO_DIVList,
    }, // 상태코드: 0=등록,1=확정, 9=구제
    {
      fieldName: 'USER_DIV_NM',
      dataType: 'text',
      header: { text: t('소속구분') },
    },
    {
      fieldName: 'BTN_STUS_CD',
      dataType: 'text',
      header: { text: t('경감') },
      renderer: { type: 'button' },
      displayCallback: function (grid, index, value) {
        return btnText(grid, index, value)
      },
    },
    {
      fieldName: 'VIO_TIME',
      dataType: 'text',
      header: { text: t('위반일시') },
      width: '150',
    },
    {
      fieldName: 'VIO_PLC_NM',
      dataType: 'text',
      header: { text: t('위반장소') },
      width: '150',
      styleName: 'left-column',
    },
    {
      fieldName: 'VIO_DESC',
      dataType: 'text',
      header: { text: t('위반내용') },
      width: '250',
      styleName: 'left-column',
    },
    {
      fieldName: 'EDU_DIV',
      dataType: 'text',
      header: { text: t('교육수료 여부') },
      width: '100',
      lookupDisplay: true,
      lookupData: codeList.EDU_DIVList,
    },
    {
      fieldName: 'DANSOK_EMP_NO',
      dataType: 'text',
      header: { text: t('단속자 사번') },
    },
    {
      fieldName: 'RELIF_NAME',
      dataType: 'text',
      header: { text: t('경감처리자 성명') },
      width: '150',
    },
    {
      fieldName: 'DANSOK_NM',
      dataType: 'text',
      header: { text: t('단속자 성명') },
    },
    {
      fieldName: 'RELIF_CAUSE',
      dataType: 'text',
      header: { text: t('경감사유') },
      width: '250',
      button: 'action',
      buttonVisibility: 'always',
    },
    { fieldName: 'CUTOFF_DT', dataType: 'text', header: { text: t('기준일') } },
    {
      fieldName: 'APP_NM',
      dataType: 'text',
      header: { text: t('승인자성명(단속조직)') },
      width: '150',
    },
    {
      fieldName: 'FILE_ID1',
      dataType: 'text',
      header: { text: t('위반첨부') },
      isFile: { value: true },
      displayCallback: function (grid, index, value) {
        return
      },
    },
    {
      fieldName: 'FILE_ID2',
      dataType: 'text',
      header: { text: t('조치첨부') },
      isFile: { value: true },
      displayCallback: function (grid, index, value) {
        return
      },
    },
    {
      fieldName: 'RELIF_FILE_ID',
      dataType: 'text',
      header: { text: t('경감첨부') },
      isFile: { value: true },
      displayCallback: function (grid, index, value) {
        return
      },
    },
    {
      fieldName: 'WMAIL_YN',
      dataType: 'text',
      header: { text: t('경고장 발송여부') },
      width: '150',
    },

    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      header: { text: t('조직') },
      visible: false,
    },
    {
      fieldName: 'VIO_NO',
      dataType: 'text',
      header: { text: t('위반번호') },
      visible: false,
    },
    {
      fieldName: 'COMPANY',
      dataType: 'text',
      header: { text: t('위반자 회사') },
      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('CMPNY_DIV') },
      visible: false,
    },
    {
      fieldName: 'WIBAN_DIV',
      dataType: 'text',
      header: { text: t('구분') },
      visible: false,
    }, // 안전:A / 교통:B
    {
      fieldName: 'IO_DIV',
      dataType: 'text',
      header: { text: t('IO_DIV') },
      visible: false,
    },
    {
      fieldName: 'WRK_PLC_CD',
      dataType: 'text',
      header: { text: t('WRK_PLC_CD') },
      visible: false,
    },
    {
      fieldName: 'USER_ID',
      dataType: 'text',
      header: { text: t('USER_ID') },
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

/* ** button 안 text 변경 ** */
const btnText = (grid, index, value) => {
  let text = null
  if (value === '0' || value === '1') {
    text = '경감'
  } else if (value === '9') {
    text = '경감취소'
  }

  return text
}

/* ** cell button 클릭시 실행 이벤트 ** */
const onCellItemClicked = async (grid, index, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (
    clickData.fieldName === 'FILE_ID1' ||
    clickData.fieldName === 'FILE_ID2'
  ) {
    fieldName.value = clickData.fieldName
    fieldIndex.value = index.dataRow

    fileUploadPopup.value.openPopup(data[clickData.fieldName])
  } else if (clickData.fieldName === 'BTN_STUS_CD') {
    let STUS_NM = null
    let VIOLATOR = null

    if (data['STUS_CD'] === '0' || data['STUS_CD'] === '1') {
      if (data['STUS_CD'] === '0') {
        STUS_NM = '등록'
      } else if (data['STUS_CD'] === '1') {
        STUS_NM = '확정'
      } else {
        STUS_NM = '경감'
      }

      data.STUS_CD = STUS_NM

      /* ****** 경감 팝업 호출 ****** */
      popupOpen.value.openPopup(data)
    } else {
      /* ****** 경감취소 버튼 클릭시 실행 ****** */
      VIOLATOR = data.VIOLATOR
      let saveYn = await vm.$swal({
        title: t(VIOLATOR + '씨를 경감취소 하시겠습니까?'),
        showCancelButton: true,
      })
      if (!saveYn.isConfirmed) {
        return
      } else {
        commonExecuteApi({
          queryId: 'EDUAC0010_SAFECANCEL_01',
          list: [data],
        }).then((res) => {
          if (res) {
            Message.success('경감가 취소되었습니다.')
            onButtonsClick({ id: 'btnSearch' })
          }
        })
      }
    }
  }
}

/* ****** 경감사유 cell button 클릭시 실행 ****** */
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  let STUS_NM = null
  if (data['STUS_CD'] === '0' || data['STUS_CD'] === '1') {
    if (data['STUS_CD'] === '0') {
      STUS_NM = '등록'
    } else if (data['STUS_CD'] === '1') {
      STUS_NM = '확정'
    } else {
      STUS_NM = '경감'
    }

    data.STUS_CD = STUS_NM

    /* ****** 경감 팝업 호출 ****** */
    popupOpen.value.openPopup(data)
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else {
    setConfirm()
  }
}

const searchData = () => {
  let data = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    CUTOFF_FROM: searchParams.CUTOFF_FROM,
    CUTOFF_TO: searchParams.CUTOFF_TO,
    STUS_YN: searchParams.STUS_YN,
    STUS_HELP: searchParams.STUS_HELP,
  }
  if (searchParams.STUS_YN === 'N') {
    data.BSNS_CD = ''
    data.DEPT_CD = ''
    data.CUTOFF_FROM = ''
    data.CUTOFF_TO = ''
  }
  return commonSearchApi({ queryId: 'EDUAC0010_SEARCH_01', param: data })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const setConfirm = async () => {
  let confirmYn = await vm.$swal({
    title: t(
      '확정시 직영과 사내협력사를 제외한 위반자의 소속조직 부서장에게는 경고장이 발송됩니다. 확정하시겠습니까?'
    ),
    showCancelButton: true,
  })
  if (!confirmYn.isConfirmed) {
    return
  } else {
    let saveParam = []
    let chekedRow = await grdMain.value.getGridView().getCheckedRows()
    if (chekedRow.length === 0) {
      Message.warn(t('선택한 데이터가 없습니다.'))

      return
    } else {
      sendWarningMessage(chekedRow)

      chekedRow.forEach((val) => {
        let data = grdMain.value.getDataProvider().getJsonRow(val)
        saveParam.push(data)
        saveParam.SAVEYN = 'Y'
        saveParam.GUBUN = data.WIBAN_DIV
      })

      /* ******************** 경고장 발송이 실패해도 확정처리 될수있게 함 ******************** */
      commonExecuteApi({
        queryId: 'EDUAC0010_CONFIRM_01',
        list: saveParam,
      }).then((res) => {
        if (res.list.length > 0) {
          res.list.forEach((element) => {
            if (element.STUS_CD === '1') {
              let param = {
                CMPNY_DIV: element.CMPNY_DIV,
                VIO_NO: element.VIO_NO,
                COMPANY: element.COMPANY,
                GUBUN: element.WIBAN_DIV,
                SAVEYN: 'N',
              }

              commonExecuteApi({
                queryId: 'EDUAC0010_POP_SAVE_01',
                list: param,
              })
            }
          })
          Message.success(t('확정되었습니다.'))

          onButtonsClick({ id: 'btnSearch' })
        }
      })
    }
  }
}

const sendWarningMessage = (rows) => {
  //'A','직영','B','협력사','D','단기공사','Z','기타'
  //조건추가:직영중에 근무지 장소 정보가 있는 사람중에 울산이 아닌 사람은 경고장 대상 포함
  let sendYn = []
  rows.forEach((e) => {
    let data = grdMain.value.getDataProvider().getJsonRow(e)
    data.USER_ID = userStore.userId
    if (
      data.IO_DIV === 'D' ||
      data.IO_DIV === 'Z' ||
      (data.IO_DIV === 'A' &&
        data.WRK_PLC_CD &&
        (data.WRK_PLC_CD !== '100' ||
          data.WRK_PLC_CD !== '101' ||
          data.WRK_PLC_CD !== '106'))
    ) {
      sendYn.push(data)
    }
  })
  if (sendYn.length === 0) {
    return
  } else {
    sendYn.forEach((e) => {
      /* ***************************** 메일주소 조회 ***************************** */
      commonSearchApi({ queryId: 'EDUAC0010_SEARCH_02', param: e }).then(
        async (res) => {
          if (res.ORESULT_CUR.length > 0) {
            let list = res.ORESULT_CUR[0]
            // mailParams.EMAIL = [res.ORESULT_CUR[0].RECV_DMAIL]
            mailParams.EMAIL = []

            /* ***************************** 경고장 번호생성 및 내역저장 ***************************** */
            commonExecuteApi({
              queryId: 'EDUAC0010_SAVE_02',
              list: res.ORESULT_CUR,
            }).then((res2) => {
              if (!res2.list[0].OUT_WNOTE_NO) {
                return
              } else {
                // let list = res2.list[0]
                let name = list.VIOLATOR + '/' + list.ASGN_NM
                let sendDt = dayjs(list.SEND_DT).format('YYYY.MM.DD')

                if (list.VEND_NAME) {
                  name = name + list.VEND_NAME
                }
                name = name + '/' + list.IO_DIV_NM

                mailParams.CONTENT = `<!doctype html>
                        <html>
                        <head>
                        <meta charset='utf-8'>
                        <title>기타/단기공사</title>
                        <style>
                          html { font-family: '돋움'; }    
                          table{border:1px solid #bbb; width: 600px;}    
                          tr{border:1px solid #bbb; }    
                          .text{display: block!important; text-decoration: underline; color: #3c3c3c; font-family: 'HY헤드라인M'; font-size: 15px; font-weight: bold; }    
                          p.text2{ line-height: 30px; text-align:center; color: #3c3c3c; margin-top: 20px; font-family: 'HY헤드라인M';font-size: 16px;}    
                          p.text3{line-height: 30px; text-align:center; font-size: 25px; font-weight:900; color: #3c3c3c;  font-family: 'HY헤드라인M';  margin-bottom:40px;}    
                          .text4{float:left!important; height: 150px; width: 17px;}    
                          .text5{display: block!important;}    
                          h3{ color:#ff0000;  font-weight: bolder; font-size: 48px; text-align: center !important; background-color: #d3d3d3;  width: 200px; margin: 20px auto; font-family: 'HY헤드라인M'; line-height: 55px; }    
                          p.info1 {font-family: '맑은 고딕'; font-size: 11px; color:#c8c8c8; margin: 10px 20px;}    
                          p.info2 {font-family: '맑은 고딕'; font-size: 11px; color:#c8c8c8; margin: 10px 20px; float: right; text-align: right;}    
                          .h40{display: block; height: 30px; line-height: 30px;font-size: 15px; font-family: 'HY중고딕';}
                        </style>
                        </head>

                        <body>
                        <table>
                            <tr>
                                <td width='30%'><p class='info1'>국문</p></td>
                                <td width='10%'></td>
                                <td width='60%'><p class='info2'>No.   ${
                                  res2.list[0].OUT_WNOTE_NO
                                    ? res2.list[0].OUT_WNOTE_NO
                                    : ''
                                }</p></td>
                            </tr>
                            <tr>
                                <td width='30%'></td>
                                <td width='40%'><h3>경 고 장</h3></td>
                                <td width='30%'></td>
                            </tr>
                            <tr>
                                <td colspan='3' style='padding: 0 40px;'>  
                                    <p style='line-height: 30px;'> <span class='text'>귀하의 부서를 통해 당사에 출입한 <span style='color:#3f48cc;'> ${
                                      list.VIOLATOR ? list.VIOLATOR : ''
                                    } </span>님의 절대수칙 위반 사실을 <br/>
                                    아래와 같이 통지하며, 추후 절대수칙 위반이 재발되지 않도록 하여 <br/> 주시기 바랍니다.</span></p>
                                    <p class='h40'>1. 위반자 성명/소속/분류 : <span style='font-size:13px;'> ${name} </span></p>
                                    <p class='h40'>2. 위반 일시 :  ${
                                      list.VIO_TIME ? list.VIO_TIME : ''
                                    } </p>
                                    <p class='h40'>3. 장소 :  ${
                                      list.VIO_PLC_DESC ? list.VIO_PLC_DESC : ''
                                    } </p>
                                    <p class='h40'>4. 위반 항목 :  ${
                                      list.VIO_MDIV_NM ? list.VIO_MDIV_NM : ''
                                    } </p>
                                    <p class='h40'>5. 위반 상세사항 :  ${
                                      list.VIO_DESC ? list.VIO_DESC : ''
                                    } </p>
                                    <p class='h40'><span class='text4'>6.</span> <span class='text5'> 상세내용 : 상기 위반자는 절대수칙 1회 위반에 따른 안전 아카데미 <br/>
                                      참석 예외대상으로서, 본 경고장 통보 및 담당부서 자체 재발방지 <br/> 교육으로 아카데미 수료를 대신합니다. 단, 향후 1년 내 절대수칙 위반 <br/>
                                      추가적발 시 당사 기준에 의거 추가적인 조치를 받을 수 있음을 <br/> 통보합니다.</span></p>
                                    <p class='text2'> ${
                                      sendDt ? sendDt : ''
                                    } </p>
                                    <center><img src=https://hises.hhi.co.kr/Common/Images/안전경영실장 도장.png width='367' height='143' alt='official seal'/></center>
                                </td>
                            </tr>
                        </table>
                        </body>
                        </html>`

                commonSendApi(mailParams)
                  .then(() => {
                    Message.success(t('메일이 전송되었습니다.'))
                  })
                  .catch((e) => {
                    let param = {
                      CMPNY_DIV: list.CMPNY_DIV,
                      WNOTE_NO: res2.list[0].OUT_WNOTE_NO,
                      VIO_NO: list.VIO_NO,
                      USER_ID: userStore.userId,
                    }
                    commonExecuteApi({
                      queryId: 'EDUAC0010_DELETE_02',
                      list: [param],
                    })
                  })
              }
            })
          }
        }
      )
    })
  }
}

const changedBSNS_CD = (val) => {
  searchParams.ASGN_NM = ''
  searchParams.DEPT_CD = ''
}

const STUS_YNChange = (e) => {
  if (e === 'N') {
    readYn.value = true
  } else {
    readYn.value = false
  }
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = (gbn) => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.bsnsCd,
      HSE_ONLY: 'Y',
      ASGN_NM: searchParams.ASGN_NM,
    })
  } else {
    deptPopup.value.openPopup({})
  }
}

/* ****************** 팝업 선택 이벤트(부서/협력사) ****************** */
const onDeptSelected = (val) => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  // onButtonsClick({ id: 'btnSearch' })
}

/* ****************** 파일첨부 선택 ******************* */
const uploaded = (val) => {
  grdMain.value
    .getDataProvider()
    .setValue(fieldIndex.value, fieldName.value, val.fileId)

  grdMain.value.getGridView().checkRow(fieldIndex.value, true)
}

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: userStore.bsnsCd,
        USE_DIV: 'Y',
      },
    }),
  ]).then((res) => {
    /* ************ 사업부 데이터 세팅 ************* */
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

    /* ************* 부서 데이터 세팅 ************** */
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })
}

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })

  // let param = {
  //   CMPNY_DIV: 'HHI',
  //   WNOTE_NO: '202212-B006',
  //   VIO_NO: '20221228A002',
  //   USER_ID: userStore.userId,
  // }

  // let test = commonExecuteApi({ queryId: "EDUAC0010_DELETE_02", list: [param] })

  // console.log(' test ' , test)
  // if(test){
  //   console.log(' 성공 ')
  // }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnConfirm']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('확정구분')"
            labelWidth="60px"
            v-model="searchParams.STUS_YN"
            :items="codeList.STUS_YNList"
            item-title="TXT"
            item-value="COD"
            @update:model-value="STUS_YNChange"
            width="300px"
          />

          <i-input
            :label="$t('확정일자')"
            labelWidth="50px"
            v-model="searchParams.CUTOFF_FROM"
            :disabled="readYn"
            type="DATE"
            width="200px"
            class="ma-0"
          />
          <i-input
            v-model="searchParams.CUTOFF_TO"
            :disabled="readYn"
            type="DATE"
            width="150px"
          />

          <i-select
            :label="$t('사업부')"
            labelWidth="50px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            :disabled="readYn"
            @update:model-value="changedBSNS_CD"
            width="300px"
          />

          <i-input
            :label="$t('부서/ 협력사')"
            label-width="80px"
            width="300px"
            v-model="searchParams.ASGN_NM"
            append-inner-icon="mdi-magnify"
            @keydown.enter="
              (e) => {
                openPopup('부서조회')
              }
            "
            @update:modelValue="
              (e) => {
                searchParams.DEPT_CD = null
              }
            "
            @click:appendInner="openPopup('click')"
            :disabled="readYn"
            class="ma-0"
          />
          <i-input v-model="searchParams.DEPT_CD" readonly width="100px" />

          <div class="d-flex align-center pl-8">
            <v-checkbox
              v-model="searchParams.STUS_HELP"
              label="경감자만 조회"
              color="rgb(81, 77, 88)"
              class="pa-1"
              :disabled="readYn"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellItemClicked"
            @onCellButtonClicked="onCellButtonClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

    <!-- 첨부파일 관리 -->
    <IUploadPopup
      ref="fileUploadPopup"
      @uploaded="uploaded"
      :buttonList="buttonList"
    />

    <EDUAC0010Popup
      ref="popupOpen"
      @reSearch="onButtonsClick({ id: 'btnSearch' })"
    />
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
