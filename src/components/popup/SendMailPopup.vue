<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest, commonSendApi } from '@hiway/api/commonApi'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import CkEditor from '@/components/ckEditor/CKEditor.vue'
import CKViewer from '@/components/ckEditor/CKViewer.vue'
import Preview from '@/components/ckEditor/Preview.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

const props = defineProps({
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  titleReadOnly: {
    type: Boolean,
    default: false,
  },
  setBgColor: {
    type: Boolean,
    default: true,
  },
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'compleat'])
const gunBun = ref(null)
const dialog = ref(false)
const editor = ref(null)
const empPopupToEmp = ref(null)
const empPopupReferer = ref(null)
const sanJeMailFlag = ref(null)

const chipArr = reactive({
  TO_EMP: [],
  REFERER: [],
})

// 메일전송
const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

const editorOptions = reactive({
  components: {
    CkEditor,
  },
  editorOptions: {
    id: 'test-ck-editor',
    data: '',
    height: '2000px',
    lang: 'ko',
  },
})

onMounted(() => {
  // 2024.06.07 박용훈 사용하지 않아서 삭제
  //nextTick(() => {
  // editor.value.setContent(mailParams.CONTENT)
  //})
})

const openPopup = (popupParam, page, EMAILDTE) => {
  //※팝업 오픈시 popupParam에 TO_EMP_NO를 사용하지 않을 경우 빈 값을 넣어주십시오.※//

  //단기공사 상세정보 메일전달 기능 추가
  if (popupParam && page == 'SAFJA0040') {
    return SendMailSAFJA0040(popupParam, EMAILDTE)
  }
  //산재정보등록현황에서 메일발송 버튼 클릭시
  if (popupParam && page == 'SAFAG0010') {
    return SendMailSAFAG0010(popupParam, EMAILDTE)
  }
  if (popupParam && page == 'SAFFC0010') {
    SendMail(popupParam, 'SAFFC0010')
    return (dialog.value = false)
  }

  if (popupParam && page == 'SAFFC0010POPUP') {
    SendMail(popupParam, 'SAFFC0010POPUP')
    return (dialog.value = false)
  }

  mailParams.EMAIL = [] //이메일
  mailParams.REFERER = [] //
  mailParams.SUBJECT = '' //제목
  mailParams.CONTENT = '' //내용
  chipArr.TO_EMP = [] //보낼사람
  chipArr.REFERER = [] //

  // ------------------------------------------------------------------------
  /* 작성자 : 이희원
   * 작성일 : 2024-01-25
   * 내용   : 위험성평가 위원회 등록/관리(RSKDA0020) 화면에서
              수신으로 지정할 인원을 선택한 후 "받는 사람"에 지정
  */
  if (!isNullCheck(popupParam.TO_EMP_NO)) {
    let newArray = popupParam.TO_EMP_NM.map((name, index) => {
      return { EMP_NM: name, EMAIL: popupParam.TO_EMP_NO[index] }
    })

    chipArr.TO_EMP = newArray

    for (let i of newArray) {
      mailParams.EMAIL.push(i.EMAIL)
    }

    if (!isNullCheck(popupParam.M_TITLE)) {
      mailParams.SUBJECT = popupParam.M_TITLE //제목
    }

    if (!isNullCheck(popupParam.M_CONTENT)) {
      mailParams.CONTENT = popupParam.M_CONTENT
      editorOptions.data = mailParams.CONTENT
    }
  }

  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  /* 작성자 : 김용환
   * 작성일 : 2024-05-21
   * 내용   : 아카데미 참석 제외 신청 메일 발송(표준 발송 방법이 되면 좋겠음)
   */
  if (!isNullCheck(popupParam.M_EMail)) {
    popupParam.M_EMail.forEach((ele) => {
      chipArr.TO_EMP.push({ EMP_NM: ele.TO_EMP_NM, EMAIL: ele.TO_EMP_EMAIL })
      mailParams.EMAIL.push(ele.TO_EMP_EMAIL)
    })

    mailParams.SUBJECT = popupParam.M_TITLE //제목
    mailParams.CONTENT = popupParam.M_CONTENT //내용
    editorOptions.data = mailParams.CONTENT
  }
  // ------------------------------------------------------------------------

  //팝업 visible
  dialog.value = true
}

//널 체크 메서드
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

// 인원조회 팝업 오픈(받는사람)
const openPopupToEmp = () => {
  empPopupToEmp.value.openPopup({ MULTI: true })
}

// 인원조회 팝업 오픈(참조)
const openPopupReferer = () => {
  empPopupReferer.value.openPopup({ MULTI: true })
}

// 인원조회(받는사람)
const onEmpSelectedToEmp = (row) => {
  for (let i of row) {
    if (i.EMAIL && i.EMAIL !== '') {
      // 사람
      chipArr.TO_EMP.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL })
      const uniqueData = Array.from(
        new Set(chipArr.TO_EMP.map(JSON.stringify))
      ).map(JSON.parse)
      chipArr.TO_EMP = uniqueData

      // email
      mailParams.EMAIL.push(i.EMAIL)
      let setMail = new Set([...mailParams.EMAIL])
      mailParams.EMAIL = [...setMail]
    } else {
      Message.warn(t(`${i.EMP_NM} 님이 이메일주소가 없습니다.`))
    }
  }
}

// 인원조회(참조)
const onEmpSelectedReferer = (row) => {
  for (let i of row) {
    if (i.EMAIL && i.EMAIL !== '') {
      // 사람
      chipArr.REFERER.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL })
      const uniqueData = Array.from(
        new Set(chipArr.REFERER.map(JSON.stringify))
      ).map(JSON.parse)
      chipArr.REFERER = uniqueData

      // email
      mailParams.REFERER.push(i.EMAIL)
      let setMail = new Set([...mailParams.REFERER])
      mailParams.REFERER = [...setMail]
    } else {
      Message.warn(t(`${i.EMP_NM} 님이 이메일주소가 없습니다.`))
    }
  }
}

const chipDel = (item) => {
  chipArr.TO_EMP = chipArr.TO_EMP.filter((x) => x.EMAIL !== item)
  mailParams.EMAIL = mailParams.EMAIL.filter((x) => x !== item)
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSendMail') {
    SendMail()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const closePopup = () => {
  //받는사람 초기화
  for (let i in chipArr) {
    chipArr[i] = []
  }
  mailParams.EMAIL = []
  mailParams.REFERER = []
  mailParams.SUBJECT = ''
  mailParams.CONTENT = ''
  dialog.value = false
}

const SendMail = (mailParamsData, GuBun, popupParam) => {
  if (GuBun == 'EMAILDTE' || GuBun === 'ENDEMAILDTE') {
    let OFFIGBN = 0
    let empList = [{ DEPT_CD: popupParam.DEPT_CD, EMP_NO: '' }]
    mailParamsData.EMAIL = []
    //재직여부(1 :재직  2:휴직  3:퇴직 4:입대)
    if (popupParam.HLD_OFFI_GBN == 3) {
      let OCCURDATE = dayjs(popupParam.OCCURDATE) //재해일자
      let RETITMPDATE = dayjs(popupParam.RETI_TMP_DATE) //퇴직일자
      empList = [{ DEPT_CD: '', EMP_NO: '' }]
      //재해일자가 퇴직일자보다 크면
      if (OCCURDATE.isAfter(RETITMPDATE)) {
        OFFIGBN = 2
      } else {
        OFFIGBN = 1
      }
    }
    let param = {
      CMPNY_DIV: popupParam.CMPNY_DIV,
      SANGBN: popupParam.SANGBN,
      BSNS_CD: popupParam.BSNS_CD,
      DEPT_CD: popupParam.DEPT_CD,
      OFFIGBN: OFFIGBN,
    }
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH07',
      param: param,
    })
      .then((res) => {
        for (let i = 0; i < res.ORESULT_CUR.length; i++) {
          mailParams.EMAIL.push(res.ORESULT_CUR[i].EMAIL)
          chipArr.TO_EMP.push({
            EMP_NM: res.ORESULT_CUR[i].KOR_NM,
            EMAIL: res.ORESULT_CUR[i].EMAIL,
          })
          //empList.push({ DEPT_CD: '', EMP_NO: res.ORESULT_CUR[i].EMP_NO })
        }
      })
      .finally(() => {
        if (empList[0].DEPT_CD.length == 4) {
          return commonSearchApi({
            queryId: 'searchDeptMail',
            param: {
              CMPNY_DIV: popupParam.CMPNY_DIV,
              DEPT_CD: empList[0].DEPT_CD,
            },
          }).then((res) => {
            if (res.ORESULT_CUR.length > 0) {
              mailParams.EMAIL.push(res.ORESULT_CUR[0].EMAIL)
              chipArr.TO_EMP.push({
                EMP_NM: res.ORESULT_CUR[0].EMP_NM,
                EMAIL: res.ORESULT_CUR[0].EMAIL,
              })
            }

            if (chipArr.TO_EMP.length === 0) {
              return Message.warn(
                t(`등록된 메일이없습니다. 받는사람을 등록해주세요.`)
              )
            }
            // // 테스트메일
            // mailParamsData.EMAIL = ['BP23200@bp.hd.com']
            try {
              // commonSendApi(mailParamsData).then((res) => {
              //   Message.success(t(`메일이 전송되었습니다.`))
              //   onClose()
              //   emit('compleat', EMAILDTE)
              // })
            } catch (e) {
              Meesage.error(e)
            }
          })
        }

        if (empList[0].DEPT_CD.length != 4) {
          let param = []
          for (let i of empList) {
            if (i.EMP_NO) {
              param.push({
                CMPNY_DIV: popupParam.CMPNY_DIV,
                BSNS_CD: '',
                DEPT_CD: '',
                ASGN_CD: '',
                USER_DIV: '',
                EMP_NO: i.EMP_NO,
                EMP_NM: '',
                RETI_TMP_DATE: '',
              })
            }
          }
          if (param.length == 0) {
            return Message.warn(
              t(`등록된 인원이없습니다. 담당자에게 문의바랍니다.`)
            )
          }
          commonSearchApi({ queryId: 'searchEMP', param: param }).then(
            (res) => {
              console.log('이거조회됨?', res)
              for (let i of res.ORESULT_CUR) {
                mailParamsData.EMAIL.push(i.EMAIL)
              }
              if (!mailParamsData.EMAIL) {
                return Message.warn(
                  t(`등록된 메일이없습니다. 담당자에게 문의바랍니다.`)
                )
              }
              // commonSendApi(mailParamsData).then((res) => {
              //   Message.success(t(`메일이 전송되었습니다.`))
              //   onClose()
              //   emit('compleat', EMAILDTE)
              // })
            }
          )
        }
      })
  }

  if (GuBun == 'SAFFC0010') {
    console.log(mailParamsData, '데이터받음')
    mailParams.EMAIL = [mailParamsData.M_EMail]
    mailParams.SUBJECT = mailParamsData.M_TITLE
    mailParams.CONTENT = mailParamsData.M_CONTENT

    commonSendApi(mailParams).then((res) => {
      Message.success(t(`메일이 전송되었습니다.`))
    })
  }

  if (GuBun == 'SAFFC0010POPUP') {
    mailParams.EMAIL = mailParamsData.M_EMail
    mailParams.SUBJECT = mailParamsData.M_TITLE
    mailParams.CONTENT = mailParamsData.M_CONTENT

    console.log(mailParamsData, 'SAFFC0010POPUP')

    commonSendApi(mailParams).then((res) => {
      Message.success(t(`메일이 전송되었습니다.`))
    })
  }
  //산재 승인메일 발송시에는 자동으로 조회가 되므로 안타도록
  if (mailParams.EMAIL.length === 0) {
    if (GuBun === 'EMAILDTE' || Gubun === 'ENDEMAILDTE') {
      return false
    }
    return Message.warn(t(`추가된 이메일이 없습니다.`))
  } else {
    mailParams.CONTENT = editor.value.getContent()
    vm.$swal({
      title: t('메일을 전송 하시겠습니까?'),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        commonSendApi(mailParams).finally(() => {
          Message.success('메일을 발송하였습니다.')
          emit('compleat', sanJeMailFlag.value)
          closePopup()
        })
      }
    })
  }
}

//  sendMail Zone
const SendMailSAFAG0010 = (popupParam, EMAILDTE) => {
  sanJeMailFlag.value = EMAILDTE

  let mail = {}

  //  산재구분
  switch (popupParam.SANGBN) {
    case 'A':
      mail.SANGBN = '일반사고'
      break
    case 'N':
      mail.SANGBN = '난청'
      break
    case 'Z':
      mail.SANGBN = '진폐'
      break
    case 'G':
      mail.SANGBN = '근골격계'
      break
  }
  // 상태
  switch (popupParam.STATUS) {
    case 'A':
      mail.STATUS = '신청'
      break
    case 'B':
      mail.STATUS = '미결'
      break
    case 'C':
      mail.STATUS = '승인'
      break
    case 'D':
      mail.STATUS = '불승인'
      break
    case 'F':
      mail.STATUS = '종결'
      break
    case 'G':
      mail.STATUS = '종결신청'
      break
    case 'H':
      mail.STATUS = '종결신청반려'
      break
  }
  // 재직상태
  switch (popupParam.HLD_OFFI_GBN) {
    case '1':
      mail.HLD_OFFI_GBN = '재직'
      break
    case '2':
      mail.HLD_OFFI_GBN = '휴직'
      break
    case '3':
      mail.HLD_OFFI_GBN = '퇴직'
      break
    case '4':
      mail.HLD_OFFI_GBN = '입대'
      break
  }
  // 요양구분
  switch (popupParam.YOGBN) {
    case '0':
      mail.YOGBN = '최초요양'
      break
    case '1':
      mail.YOGBN = '재요양'
      break
  }
  //승인발송할때
  if (EMAILDTE == 'EMAILDTE') {
    if (popupParam.SANGBN == 'N') {
      dialog.value = true
      mailParams.SUBJECT = `${popupParam.BSNS_NM} ${popupParam.DEPT_NM} ${popupParam.KOR_NM} 난청 결과 통지서(${mail.HLD_OFFI_GBN}) 입니다.`
      mailParams.CONTENT = `<span style="font-size:14pt; font-family:HD현대체 Light">안녕하세요.</span><br>
        <span style="font-size:14pt; font-family:HD현대체 Light">${popupParam.BSNS_NM} ${popupParam.DEPT_NM} ${popupParam.KOR_NM}(${popupParam.EMPLNO}) (${popupParam.JOB_TIT_NM}) 난청 ${mail.STATUS} 되었습니다.</span><br>
        <p></p>
        <span style="font-weight:bold;font-size:14pt;font-family:HD현대체 Light ">재해일자 : ${popupParam.OCCURDATE}</span>
        <p></p>
        <span style="font-size:14pt; font-family:HD현대체 Light">승인 결과 안내 드립니다.</span></span><br>
        <span style="font-size:14pt; font-family:HD현대체 Light">좋은하루 되세요.</span>
        <p></p>
        <span style="font-size:14pt; font-family:HD현대체 Light">최 수 진</span> <br>
        <span style="font-size:14pt; font-family:HD현대체 Light">경영지원본부 법무지원팀 / 사원</span>`
      console.log('메일파람', mailParams.CONTENT)
      setTimeout(() => {
        editorOptions.data = mailParams.CONTENT
      }, 500)
    } else {
      dialog.value = true
      mailParams.SUBJECT = ` (산재-${mail.YOGBN}) ${popupParam.BSNS_NM} ${popupParam.DEPT_NM} ${popupParam.KOR_NM} 산재결과 통지서(${mail.HLD_OFFI_GBN})`
      mailParams.CONTENT = `<span style="font-size:14pt; font-family:HD현대체 Light">안녕하세요.</span><br>
        <span style="font-size:14pt; font-family:HD현대체 Light">${
          popupParam.BSNS_NM
        } ${popupParam.DEPT_NM} ${popupParam.KOR_NM} (${popupParam.EMPLNO}) (${
        popupParam.JOB_TIT_NM
      })  ${mail.YOGBN} ${mail.STATUS} 되었습니다.</span>
        <p></p>
        <span style="font-size:14pt;font-weight:bold;font-family:HD현대체 Light">재해일자 : ${
          popupParam.OCCURDATE
        }</span>
        <p></p>
        ${
          mail.HLD_OFFI_GBN === '재직'
            ? '<span style="font-size:14pt; font-family:HD현대체 Light">승인 결과 안내 드립니다.</span> <br> <span style="font-size:14pt; font-family:HD현대체 Light">좋은 하루 되세요.</span>'
            : '<span style="font-size:14pt; font-family:HD현대체 Light">승인 결과 안내 드립니다.</span> <br> <span style="font-size:14pt; font-family:HD현대체 Light">좋은 하루 되세요.</span>'
        }
        <p></p>
                          <span style="font-size:14pt; font-family:HD현대체 Light">최 수 진</span> <br>
                          <span style="font-size:14pt; font-family:HD현대체 Light">경영지원본부 법무지원팀 / 사원</span>
                          `

      console.log('메일파람', mailParams.CONTENT)
      setTimeout(() => {
        editorOptions.data = mailParams.CONTENT
      }, 500)
    }

    SendMail(mailParams, EMAILDTE, popupParam)
  } else if (EMAILDTE == 'ENDEMAILDTE') {
    dialog.value = true
    mailParams.SUBJECT = `(산재종결) ${popupParam.BSNS_NM} - ${popupParam.DEPT_NM} ${popupParam.KOR_NM}님 산재 종결안내`
    mailParams.CONTENT = `<span style="font-size:14pt; font-family:HD현대체 Light">안녕하세요</span>
                        <span style="font-size:14pt; font-family:HD현대체 Light">${popupParam.BSNS_NM} ${popupParam.DEPT_NM} ${popupParam.KOR_NM}(${popupParam.EMPLNO}) (${popupParam.JOB_TIT_NM})님 산재요양 종결 안내드립니다.</span><br>
                        <p></p>
                        <span style="font-weight:bold;font-size:14pt;font-family:HD현대체 Light "> - 재해일자 : ${popupParam.OCCURDATE}</span><br>
                        <span style="font-weight:bold;font-size:14pt;font-family:HD현대체 Light "> - 종결일자 : ${popupParam.ENDDTE}</span><br>
                        <p></p>
                        <span style="font-size:14pt; font-family:HD현대체 Light">좋은 하루 되세요.</span><br>
                        <span style="font-size:14pt; font-family:HD현대체 Light">최 수 진</span>
                        <span style="font-size:14pt; font-family:HD현대체 Light">경영지원본부 법무지원팀 / 사원</span>
                        `
    console.log('메일파람', mailParams.CONTENT)

    editorOptions.data = mailParams.CONTENT
    setTimeout(() => {
      SendMail(mailParams, EMAILDTE, popupParam)
    }, 500)
  }
}

const SendMailSAFJA0040 = (popupParam, EMAILDTE) => {
  dialog.value = true

  console.log(
    'SendMailSAFJA0040 :: ',
    popupParam,
    ' popupParam.paraData :: ',
    popupParam.paraData
  )
  mailParams.SUBJECT = `단기공사 출입신청 건 전달 - ${popupParam.paraData.VND_NAME}`
  mailParams.CONTENT = `
                        <p style="line-height:30px;">
                            <span class="text">안녕하십니까?</span>
                        </p>
                        <p style="line-height:30px;">
                            <br>
                            <span class="text">아래와 같이 단기공사 출입정보를 전달 드리오니 참조바랍니다.&nbsp;</span>&nbsp;&nbsp;&nbsp;
                            <br>
                        </p>
                        <p style="line-height:30px;">
                            <span class="text"><strong>1. 관련부서 정보</strong></span>
                        </p>
                        <table class="" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 공사담당부서 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:130px;"> ${
                                popupParam.paraData.DEPT_PIC_DEPTNM === null
                                  ? ''
                                  : popupParam.paraData.DEPT_PIC_DEPTNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${
                                popupParam.paraData.DEPT_PIC_EMPNM === null
                                  ? ''
                                  : popupParam.paraData.DEPT_PIC_EMPNM
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사관리부서 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; "> ${
                                popupParam.paraData.WRK_MNG_DEPTNM === null
                                  ? ''
                                  : popupParam.paraData.WRK_MNG_DEPTNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.WRK_MNG_EMPNM === null
                                  ? ''
                                  : popupParam.paraData.WRK_MNG_EMPNM
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 출입신청부서 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; "> ${
                                popupParam.paraData.REQ_PIC_DEPTNM === null
                                  ? ''
                                  : popupParam.paraData.REQ_PIC_DEPTNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.REQ_PIC_EMPNM === null
                                  ? ''
                                  : popupParam.paraData.REQ_PIC_EMPNM
                              } </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="line-height:30px;">
                            <span class="text"><strong>2.협력회사 정보</strong></span>
                        </p>
                          <table class="" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 협력회사명 </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${
                                  popupParam.paraData.VND_NAME === null
                                    ? ''
                                    : popupParam.paraData.VND_NAME
                                } </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 사업자번호 </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${
                                  popupParam.paraData.BIZ_REG_NO_DISP === null
                                    ? ''
                                    : popupParam.paraData.BIZ_REG_NO_DISP
                                } </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 대표자 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    popupParam.paraData.WRK_MNG_DEPTNM === null
                                      ? ''
                                      : popupParam.paraData.WRK_MNG_DEPTNM
                                  } </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 전화번호 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    popupParam.paraData.WRK_MNG_EMPNM === null
                                      ? ''
                                      : popupParam.paraData.WRK_MNG_EMPNM
                                  } </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 산재보험 No </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    popupParam.paraData.INJR_INSR_NO === null
                                      ? ''
                                      : popupParam.paraData.INJR_INSR_NO
                                  } </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 단체보상보험No </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    popupParam.paraData.GROUP_INSR_NO === null
                                      ? ''
                                      : popupParam.paraData.GROUP_INSR_NO
                                  } </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 주소 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;" colSpan="3"> ${
                                    popupParam.paraData.VEND_ADDR === null
                                      ? ''
                                      : popupParam.paraData.VEND_ADDR
                                  } </td>
                              </tr>
                            </tbody>
                          </table>

                        <p style="line-height:30px;">
                            <span class="text"><strong>3. 공사내역 정보</strong></span>
                        </p>
                        <table class="" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 공사명 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:650px;"> ${
                                  popupParam.paraData.WORK_DESC === null
                                    ? ''
                                    : popupParam.paraData.WORK_DESC
                                } </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사내용 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  popupParam.paraData.DTL_WORK_DESC === null
                                    ? ''
                                    : popupParam.paraData.DTL_WORK_DESC
                                } </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 출입용도 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  popupParam.paraData.ENTRANCE_NM === null
                                    ? ''
                                    : popupParam.paraData.ENTRANCE_NM
                                } </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사장소 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  popupParam.paraData.WORK_AREA_NM === null
                                    ? ''
                                    : popupParam.paraData.WORK_AREA_NM
                                } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사책임자 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.NAME === null
                                  ? ''
                                  : popupParam.paraData.NAME
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:110px;"> 공사기간 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.WORK_DT === null
                                  ? ''
                                  : popupParam.paraData.WORK_DT
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 휴대폰 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.MOBILE === null
                                  ? ''
                                  : popupParam.paraData.MOBILE
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 현장전화 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.REQ_PIC_DEPTNM === null
                                  ? ''
                                  : popupParam.paraData.REQ_PIC_DEPTNM
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 위험작업대상 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.DANGER_DIVNM === null
                                  ? ''
                                  : popupParam.paraData.DANGER_DIVNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 출입인원 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.PERSON_CNT === null
                                  ? ''
                                  : popupParam.paraData.PERSON_CNT
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 유해화학물질 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.HARM_CMCAL === null
                                  ? ''
                                  : popupParam.paraData.HARM_CMCAL
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 사용장비 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                popupParam.paraData.USE_EQUIP === null
                                  ? ''
                                  : popupParam.paraData.USE_EQUIP
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 장비운전자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:80px;"> 성명 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:100px;"> ${
                                popupParam.paraData.EQUIP_DRIVER === null
                                  ? ''
                                  : popupParam.paraData.EQUIP_DRIVER
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:100px;"> 관련자격 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:220px;"> ${
                                popupParam.paraData.RELE_LICENSE === null
                                  ? ''
                                  : popupParam.paraData.RELE_LICENSE
                              } </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="line-height:30px;">
                            <span class="text"><strong>4. 인원/차량 정보</strong></span>
                        </p>

                        <table class="ck-table-resized" style="border-collapse: collapse;">
                          <thead>
                            <tr>
                                <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                                    성명
                                </th>
                                <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:80px;">
                                    생년월일
                                </th>
                                <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:220px;">
                                    출입기간
                                </th>
                                <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:150px;">
                                    출입문
                                </th>
                                <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                                    차종
                                </th>
                                <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                                    차량번호
                                </th>
                            </tr>
                          </thead>
                          <tbody>
                                    `
  let bodyStr = ``
  for (let i = 0; i < popupParam.personData.length; i++) {
    let conStr = `
                              <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
                                  ${
                                    popupParam.personData[i].NAME === null
                                      ? ''
                                      : popupParam.personData[i].NAME
                                  }
                                </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
                                  ${
                                    popupParam.personData[i].BIR_DAY === null
                                      ? ''
                                      : popupParam.personData[i].BIR_DAY
                                  }
                                </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
                                  ${
                                    popupParam.personData[i].WORK_DT === null
                                      ? ''
                                      : popupParam.personData[i].WORK_DT
                                  }
                                </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
                                  ${
                                    popupParam.personData[i].GATE_NM === null
                                      ? ''
                                      : popupParam.personData[i].GATE_NM
                                  }
                                </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
                                  ${
                                    popupParam.personData[i].CAR_KIND === null
                                      ? ''
                                      : popupParam.personData[i].CAR_KIND
                                  }
                                </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
                                  ${
                                    popupParam.personData[i].CAR_NO === null
                                      ? ''
                                      : popupParam.personData[i].CAR_NO
                                  }
                                </td>
                              </tr>
                              `
    bodyStr = bodyStr + conStr
  }

  if (popupParam.personData.length < 1) {
    bodyStr = `<tr>
                                  <td>
                                      &nbsp;
                                  </td>
                                  <td>
                                      &nbsp;
                                  </td>
                                  <td>
                                      &nbsp;
                                  </td>
                                  <td>
                                      &nbsp;
                                  </td>
                                  <td>
                                      &nbsp;
                                  </td>
                                  <td>
                                      &nbsp;
                                  </td>
                                </tr>`
  }
  mailParams.CONTENT =
    mailParams.CONTENT +
    bodyStr +
    `
                          </tbody>
                        </table>
                        `

  // nextTick(() => {
  // editorOptions.editorOptions.data = mailParams.CONTENT
  editorOptions.data = mailParams.CONTENT

  // console.log('editorOptions' , editorOptions)
  // editor.value.setContent()
  // })
  // SendMail(mailParams,EMAILDTE,popupParam)
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog v-model="dialog" persistent width="900">
    <div class="title-bar" @mousedown="startDragging">메일 전송</div>
    <VContainer style="background-color: white" class="pt-0">
      <VRow class="mt-3">
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnSendMail', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow class="mt-3" style="max-height: 750px; overflow-y: auto">
        <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>
              <VCol cols="12" md="12">
                <ILabel :label="$t('받는사람')" labelLoc="top" :required="true">
                  <template #editor="editorProps">
                    <VTextField
                      append-inner-icon="mdi-magnify"
                      @click:appendInner="openPopupToEmp"
                      readonly
                      :class="!props.setBgColor ? '' : 'setWhiteColor'"
                    >
                      <v-chip
                        v-for="(item, i) in chipArr.TO_EMP"
                        :key="i"
                        class="ma-2"
                        size="small"
                        @click="chipDel(item.EMAIL)"
                      >
                        {{ item.EMP_NM }}
                      </v-chip>
                    </VTextField>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="12">
                <ILabel :label="$t('참조')" labelLoc="top" :required="true">
                  <template #editor="editorProps">
                    <VTextField
                      append-inner-icon="mdi-magnify"
                      @click:appendInner="openPopupReferer({ gbn: 'Referer' })"
                      readonly
                      :class="!props.setBgColor ? '' : 'setWhiteColor'"
                    >
                      <v-chip
                        v-for="(item, i) in chipArr.REFERER"
                        :key="i"
                        class="ma-2"
                        size="small"
                        @click="chipDel(item.EMAIL)"
                      >
                        {{ item.EMP_NM }}
                      </v-chip>
                    </VTextField>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="12">
                <ILabel :label="$t('제목')" labelLoc="top">
                  <template #editor="editorProps">
                    <VTextField
                      :readonly="titleReadOnly ? titleReadOnly : false"
                      v-model="mailParams.SUBJECT"
                      :rules="editorProps.rules"
                      :hide-details="editorProps.hideDetails"
                    />
                  </template>
                </ILabel>
              </VCol>
            </VRow>
          </VForm>
          <VRow>
            <VCol>
              <div id="app">
                <v-card flat>
                  <v-card-text class="pa-0">
                    <ck-editor
                      ref="editor"
                      :id="editorOptions.id"
                      :initialValue="editorOptions.data"
                      :lang="editorOptions.lang"
                      :height="editorOptions.height"
                      :isReadOnly="isReadOnly ? 'true' : 'false'"
                    />
                  </v-card-text>
                </v-card>
              </div>
            </VCol>
          </VRow>
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
  <EmpPopup ref="empPopupToEmp" @selected="onEmpSelectedToEmp" />
  <EmpPopup ref="empPopupReferer" @selected="onEmpSelectedReferer" />
</template>

<style scoped>
.td {
  border: 1px solid black;
}

::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}
</style>
