<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { getCodeList, commonSearchApi, commonRequest, commonExecuteApi, commonSendSMS } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import _ from 'lodash'
import { chkEmpty } from '@/utils/common'
import sha256 from 'crypto-js/sha256'
import IUpload from '@/components/IUpload.vue'
import DATDA0010Popup02 from '@/pages/70_data/DAT_D/DATDA0010Popup02.vue'
import DATDA0010Popup04 from '@/pages/70_data/DAT_D/DATDA0010Popup04.vue'

const emit = defineEmits(['saved'])

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const isAdmin = ref(userStore.authGrpCd.includes('DATDA001'))

const detailParam = ref({})
const dialog = ref(false)
const fileUpload1 = ref(null)
const fileUpload2 = ref(null)
const popUpdate = ref(null)
const popAnswer = ref(null)
const reply1 = ref('1')
const reply2 = ref('1')

const codeList = reactive({
  STATUS: [],
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEQ: '',
  TITLE: '',
  TITLE2: '',
  CONTENT: '',
  NOTI_YN: 'N',
  FILE_ID: '',
  NICK_NAME: '',
  PASS: '',
  PASS_INPUT: '',
  STATUS: 'A',
  CONTENT_HD: '',
  ANSWER_CNT: 0,
  SEARCH_CNT: 0,
  AGREE_CNT: 0,
  AGREE_YN: '',
})

const initSaveParams = _.cloneDeep(saveParams)

const answerParams = reactive({
  CMPNY_DIV: '',
  NOTI_SEQ: '',
  TITLE: '',
  CONTENT: '',
  FILE_ID: '',
  NICK_NAME: '',
  PASS: '',
  PASS_INPUT: '',
  AGREE_CNT: 0,
  AGREE_YN: '',
  SEARCH_CNT: 0,
})

const initAnswerParams = _.cloneDeep(answerParams)

// 본문의 댓글 등록하기
const replyParams1 = reactive({
  GBN: 'A',
  SEQ1: '',
  SEQ2: '',
  NICK_NAME: '',
  PASS: '',
  PASS_OK: '',
  PASS_INPUT: '',
  PASS_OK_INPUT: '',
  CONTENT: '',
  EMP_YN : 'N',
})

const initReplyParams1 = _.cloneDeep(replyParams1)

// 답변의 댓글 등록하기
const replyParams2 = reactive({
  GBN: 'B',
  SEQ1: '',
  SEQ2: '',
  NICK_NAME: '',
  PASS: '',
  PASS_OK: '',
  PASS_INPUT: '',
  PASS_OK_INPUT: '',
  CONTENT: '',
  EMP_YN : 'N',
})

const initReplyParams2 = _.cloneDeep(replyParams2)

const replyLists = reactive({
  NOTICE: [],
  ANSWER: [],
})

const getCommonCode = () => {
  Promise.all([
    getCodeList('HHIZ090HA'),
  ]).then(res => {
    codeList.STATUS = res[0].ORESULT_CUR
  })
}

const init = () => {
  Object.keys(saveParams).forEach(key => { saveParams[key] = initSaveParams[key] })
  Object.keys(answerParams).forEach(key => { answerParams[key] = initAnswerParams[key] })
  
  replyLists.NOTICE = []
  replyLists.ANSWER = []

  getCommonCode()
}

const initReply1 = () => {
  Object.keys(initReplyParams1).forEach(key => { replyParams1[key] = initReplyParams1[key] })

  replyParams1.CMPNY_DIV = detailParam.value.CMPNY_DIV
  replyParams1.NOTI_SEQ = detailParam.value.SEQ
}

const initReply2= () => {
  Object.keys(initReplyParams2).forEach(key => { replyParams2[key] = initReplyParams2[key] })

  replyParams2.CMPNY_DIV = detailParam.value.CMPNY_DIV
  replyParams2.NOTI_SEQ = detailParam.value.SEQ
}

const openPopup = async mode => {
  detailParam.value = mode
  init()

  // 조회수
  await commonExecuteApi({ queryId: 'DATDA0010_UPDATE_SEARCH_CNT', list: [detailParam.value] })
  await searchData()

  // console.log('detailParam.value', detailParam.value)
  // console.log('saveParams', saveParams)
  
  if(detailParam.value.GBN === 'A' && chkEmpty(saveParams.SEQ)) {
    Message.warn('삭제된 게시글입니다.')
    return
  } else if(detailParam.value.GBN === 'B' && chkEmpty(answerParams.NOTI_SEQ)) {
    Message.warn('삭제된 답변입니다.')
    return
  }

  dialog.value = true
}

const searchData = async () => {
  await commonRequest(
    '/hse/DATDA0010/searchContent',
    {
      queryId: 'DATDA0010_SEARCH_04',
      param: {
        CMPNY_DIV: detailParam.value.CMPNY_DIV,
        SEQ: detailParam.value.SEQ,
        USER_ID: userStore.userId,
      }
    }
  ).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      Object.keys(saveParams).forEach(key => {
        saveParams[key] = res.ORESULT_CUR[0][key] ?? ''
      })

      saveParams.USER_ID = userStore.userId
      saveParams.delNotice = false
      saveParams.changeStatus = false

      // console.log('saveParams', saveParams)

      fileUpload1.value.setGuid(saveParams.FILE_ID)
      fileUpload1.value.onButtonsClick({ id: 'btnSearch' })
    }
  })

  await commonRequest(
    '/hse/DATDA0010/searchContent',
    {
      queryId: 'DATDA0010_SEARCH_05',
      param: {
        CMPNY_DIV: detailParam.value.CMPNY_DIV,
        NOTI_SEQ: detailParam.value.SEQ,
        USER_ID: userStore.userId,
      }
    }
  ).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      Object.keys(answerParams).forEach(key => {
        answerParams[key] = res.ORESULT_CUR[0][key] ?? ''
      })

      answerParams.USER_ID = userStore.userId
      saveParams.delAnswer = false

      // console.log('answerParams', answerParams)

      fileUpload2.value.setGuid(answerParams.FILE_ID)
      fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
    }
  })

  await commonSearchApi({
    queryId: 'DATDA0010_SEARCH_06',
    param: {
      CMPNY_DIV: detailParam.value.CMPNY_DIV,
      NOTI_SEQ: detailParam.value.SEQ,
    }
  }).then(res => {
    // console.log('reply result', res.ORESULT_CUR)
    initReply1()
    initReply2()

    const temp = res.ORESULT_CUR
    const reply1 = []
    const reply2 = []

    for(let i = 0; i < temp.length; i++) {
      const row = temp[i]

      row.editable = false
      row.addReply = false
      row.delReply = false
      row.CONTENT_ORG = temp[i].CONTENT
      row.PASS_INPUT = ''
      row.PASS_OK_INPUT = ''

      row.subReplyForm = {
        CMPNY_DIV: row.CMPNY_DIV,
        GBN: row.GBN,
        NOTI_SEQ: row.NOTI_SEQ,
        SEQ1: row.SEQ1,
        SEQ2: '',
        NICK_NAME: '',
        PASS: '',
        PASS_OK: '',
        PASS_INPUT: '',
        PASS_OK_INPUT: '',
        CONTENT: '',
        EMP_YN : 'N'
      }

      row.subReplyFormOrg = _.cloneDeep(row.subReplyForm)

      if(row.GBN === 'A') {
        reply1.push(row)
      } else if(row.GBN === 'B') {
        reply2.push(row)
      }
    }

    // const mainReply = _.filter(temp, row => { return row.SEQ2 === 0 })
    // const subReply = _.filter(temp, row => { return row.SEQ2 !== 0 })
    
    // console.log('mainReply', mainReply)
    // console.log('subReply', subReply)

    // for(let i = 0; i < mainReply.length; i++) {
    //   const main = mainReply[i]

    //   if(main.GBN === 'A') {
    //     main.items = _.filter(subReply, row => { return row.GBN === main.GBN && row.SEQ1 === main.SEQ1 })
    //     reply1.push(main)
    //   } else if(main.GBN === 'B') {
    //     main.items = _.filter(subReply, row => { return row.GBN === main.GBN && row.SEQ1 === main.SEQ1 })
    //     reply2.push(main)
    //   }
    // }

    replyLists.NOTICE = reply1
    replyLists.ANSWER = reply2

    // console.log('replyLists', replyLists)
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnChangeStatus') {
    vm.$swal({
      title: t(`접수상태를 변경 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        commonExecuteApi({ queryId: 'DATDA0010_SAVE_06', list: [saveParams] }).then(res => {
          searchData()
          Message.success('접수상태가 변경 되었습니다.')
        })
      }
    })
  } else if(btnId === 'btnAnswer') {
    // addAnswer.value = true
    popAnswer.value.openPopup({ CMPNY_DIV: saveParams.CMPNY_DIV, NOTI_SEQ: saveParams.SEQ, TITLE: saveParams.TITLE2, })
  } else if(btnId === 'btnModify') {
    popUpdate.value.openPopup(detailParam.value)
  } else if(btnId === 'btnDelete') {
    if(!isAdmin.value && chkEmpty(saveParams.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(!isAdmin.value && sha256(saveParams.PASS_INPUT).toString() !== saveParams.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return
    }

    vm.$swal({
      title: t(`본문을 삭제 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        commonExecuteApi({ queryId: 'DATDA0010_DELETE_04', list: [saveParams] }).then(res => {
          fileUpload1.value.deleteFiles()
          fileUpload2.value.deleteFiles()
          Message.success('본문이 삭제 되었습니다.')
          emit('saved')
          onButtonsClick({ id: 'btnClose' })
        })
      }
    })
  } else if(btnId === 'btnAgree') {
    const isCancel = saveParams.AGREE_YN === 'Y'

    vm.$swal({
      title: t(`공감${isCancel ? ' 취소' : ''} 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {
          CMPNY_DIV: saveParams.CMPNY_DIV,
          NOTI_SEQ: saveParams.SEQ,
          GBN: 'A',
          EMP_NO: saveParams.USER_ID,
          AGREE_YN: isCancel ? '' : 'Y',
        }
        
        commonExecuteApi({ queryId: 'DATDA0010_UPDATE_AGREE_YN', list: [param] }).then(res => {
          searchData()
          Message.success(`공감${isCancel ? ' 취소' : ''} 되었습니다.`)
        })
      }
    })
  } else if(btnId === 'btnDisagree') {
    const isCancel = saveParams.AGREE_YN === 'N'

    vm.$swal({
      title: t(`비공감${isCancel ? ' 취소' : ''} 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {
          CMPNY_DIV: saveParams.CMPNY_DIV,
          NOTI_SEQ: saveParams.SEQ,
          GBN: 'A',
          EMP_NO: saveParams.USER_ID,
          AGREE_YN: isCancel ? '' : 'N',
        }
        
        commonExecuteApi({ queryId: 'DATDA0010_UPDATE_AGREE_YN', list: [param] }).then(res => {
          searchData()
          Message.success(`비공감${isCancel ? ' 취소' : ''} 되었습니다.`)
        })
      }
    })
  } else if(btnId === 'btnRegistReply1') {
    if(chkEmpty(replyParams1.NICK_NAME)) {
      Message.warn('별명을 입력해주세요.')
      return
    } else if(chkEmpty(replyParams1.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(replyParams1.PASS_INPUT.length < 6) {
      Message.warn('비밀번호는 6글자 이상입니다.')
      return
    } else if(chkEmpty(replyParams1.SEQ1) && replyParams1.PASS_INPUT !== replyParams1.PASS_OK_INPUT) {
      Message.warn('비밀번호와 비밀번호 확인의 값이 다릅니다.')
      return
    } else if(!chkEmpty(replyParams1.SEQ1) && sha256(replyParams1.PASS_INPUT).toString() !== replyParams1.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return
    } else if(chkEmpty(replyParams1.CONTENT)) {
      Message.warn('내용을 입력해주세요.')
      return
    }

    vm.$swal({
      title: t(`댓글을 등록 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {}
        Object.keys(replyParams1).forEach(key => {
          if(key.indexOf('_INPUT') < 0) {
            if(key.indexOf('PASS') > -1) {
              param[key] = sha256(replyParams1[`${key}_INPUT`]).toString()
            } else {
              param[key] = replyParams1[key]
            }
          }
        })

        // console.log('DATDA0010_SAVE_05 param', param)

        commonExecuteApi({ queryId: 'DATDA0010_SAVE_05', list: [param] }).then(async res => {
          await searchData()
          Message.success('댓글이 등록 되었습니다.')

          commonSearchApi({
            queryId: 'DATDA0010_SEARCH_07',
            param: { 
              CMPNY_DIV: saveParams.CMPNY_DIV,
              CONTENT_HD: saveParams.CONTENT_HD,
            }
          }).then(target => {
            const dtTarget = target.ORESULT_CUR

            for(let i = 0; i < dtTarget.length; i++) {
              if(!chkEmpty(dtTarget[i].HND_PHN)) {
                commonSendSMS({
                  EMPNO_FROM: 'A490342',
                  EMPNO_TO: dtTarget[i].EMP_NO,
                  SYSCODE: '156',
                  FROM_P_NO: '0522036394',
                  TO_P_NO: dtTarget[i].HND_PHN,
                  TITLE: `HiSEs 안전 소통 게시판에 등록된 게시글에 댓글이 등록되었습니다. 확인 바랍니다.(글번호: ${saveParams.SEQ})`
                })
              }
            }
          })
        })
      }
    })
  } else if(btnId === 'btnUpdateReply') {
    // console.log('btn.item', btn.item)

    if(chkEmpty(btn.item.NICK_NAME)) {
      Message.warn('별명을 입력해주세요.')
      return false
    } else if(chkEmpty(!isAdmin.value && btn.item.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(!isAdmin.value && sha256(btn.item.PASS_INPUT).toString() !== btn.item.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return
    } else if(chkEmpty(btn.item.CONTENT)) {
      Message.warn('내용을 입력해주세요.')
      return
    }

    vm.$swal({
      title: t(`댓글을 수정 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {}
        Object.keys(btn.item).forEach(key => {
          if(key.indexOf('_INPUT') < 0) {
            param[key] = btn.item[key]
          }
        })

        // console.log('DATDA0010_SAVE_05 param', param)

        commonExecuteApi({ queryId: 'DATDA0010_SAVE_05', list: [param] }).then(res => {
          searchData()
          Message.success('댓글이 수정되었습니다.')
        })
      }
    })
  } else if(btnId === 'btnRegistSubReply') {
    if(chkEmpty(btn.item.NICK_NAME)) {
      Message.warn('별명을 입력해주세요.')
      return
    } else if(chkEmpty(btn.item.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(btn.item.PASS_INPUT.length < 6) {
      Message.warn('비밀번호는 6글자 이상입니다.')
      return
    } else if(btn.item.PASS_INPUT !== btn.item.PASS_OK_INPUT) {
      Message.warn('비밀번호와 비밀번호 확인의 값이 다릅니다.')
      return
    } else if(chkEmpty(btn.item.CONTENT)) {
      Message.warn('내용을 입력해주세요.')
      return
    }

    vm.$swal({
      title: t(`댓글을 등록 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {}
        Object.keys(btn.item).forEach(key => {
          if(key.indexOf('_INPUT') < 0) {
            if(key.indexOf('PASS') > -1) {
              param[key] = sha256(btn.item[`${key}_INPUT`]).toString()
            } else {
              param[key] = btn.item[key]
            }
          }
        })

        // console.log('DATDA0010_SAVE_05 param', param)

        commonExecuteApi({ queryId: 'DATDA0010_SAVE_05', list: [param] }).then(res => {
          searchData()
          Message.success('댓글이 등록 되었습니다.')
        })
      }
    })
  } else if(btnId === 'btnDeleteReply') {
    if(!isAdmin.value && chkEmpty(btn.item.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(!isAdmin.value && sha256(btn.item.PASS_INPUT).toString() !== btn.item.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return
    }

    vm.$swal({
      title: t(`댓글을 삭제 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        commonExecuteApi({ queryId: 'DATDA0010_DELETE_03', list: [btn.item] }).then(res => {
          searchData()
          Message.success('댓글이 삭제 되었습니다.')
        })
      }
    })
  } else if(btnId === 'btnClose') {
    dialog.value = false
  }
}

const onButtonsClick2 = btn => {
  const btnId = btn.id

  if(btnId === 'btnModify') {
    popAnswer.value.openPopup(answerParams)
  } else if(btnId === 'btnDelete') {
    // if(chkEmpty(answerParams.PASS_INPUT)) {
    //   Message.warn('비밀번호를 입력해주세요.')
    //   return
    // } else if(sha256(answerParams.PASS_INPUT).toString() !== answerParams.PASS) {
    //   Message.warn('잘못된 비밀번호입니다.')
    //   return
    // }

    vm.$swal({
      title: t(`답변을 삭제 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        commonExecuteApi({ queryId: 'DATDA0010_DELETE_05', list: [answerParams] }).then(async res => {
          await fileUpload2.value.deleteFiles()
          Message.success('답변이 삭제 되었습니다.')

          if(detailParam.value.GBN === 'A') {
            searchData()
          } else if(detailParam.value.GBN === 'B') {
            emit('saved')
            onButtonsClick({ id: 'btnClose' })
          }
        })
      }
    })
  } else if(btnId === 'btnAgree') {
    const isCancel = answerParams.AGREE_YN === 'Y'

    vm.$swal({
      title: t(`공감${isCancel ? ' 취소' : ''} 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {
          CMPNY_DIV: saveParams.CMPNY_DIV,
          NOTI_SEQ: saveParams.SEQ,
          GBN: 'B',
          EMP_NO: saveParams.USER_ID,
          AGREE_YN: isCancel ? '' : 'Y',
        }
        
        commonExecuteApi({ queryId: 'DATDA0010_UPDATE_AGREE_YN', list: [param] }).then(res => {
          searchData()
          Message.success(`공감${isCancel ? ' 취소' : ''} 되었습니다.`)
        })
      }
    })
  } else if(btnId === 'btnDisagree') {
    const isCancel = answerParams.AGREE_YN === 'N'

    vm.$swal({
      title: t(`비공감${isCancel ? ' 취소' : ''} 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {
          CMPNY_DIV: saveParams.CMPNY_DIV,
          NOTI_SEQ: saveParams.SEQ,
          GBN: 'B',
          EMP_NO: saveParams.USER_ID,
          AGREE_YN: isCancel ? '' : 'N',
        }
        
        commonExecuteApi({ queryId: 'DATDA0010_UPDATE_AGREE_YN', list: [param] }).then(res => {
          searchData()
          Message.success(`비공감${isCancel ? ' 취소' : ''} 되었습니다.`)
        })
      }
    })
  } else if(btnId === 'btnRegistReply2') {
    if(chkEmpty(replyParams2.NICK_NAME)) {
      Message.warn('별명을 입력해주세요.')
      return
    } else if(chkEmpty(replyParams2.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(replyParams2.PASS_INPUT.length < 6) {
      Message.warn('비밀번호는 6글자 이상입니다.')
      return
    } else if(chkEmpty(replyParams2.SEQ1) && replyParams2.PASS_INPUT !== replyParams2.PASS_OK_INPUT) {
      Message.warn('비밀번호와 비밀번호 확인의 값이 다릅니다.')
      return
    } else if(!chkEmpty(replyParams2.SEQ1) && sha256(replyParams2.PASS_INPUT).toString() !== replyParams2.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return
    } else if(chkEmpty(replyParams2.CONTENT)) {
      Message.warn('내용을 입력해주세요.')
      return
    }

    vm.$swal({
      title: t(`댓글을 등록 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {}
        Object.keys(replyParams2).forEach(key => {
          if(key.indexOf('_INPUT') < 0) {
            if(key.indexOf('PASS') > -1) {
              param[key] = sha256(replyParams2[`${key}_INPUT`]).toString()
            } else {
              param[key] = replyParams2[key]
            }
          }
        })

        // console.log('DATDA0010_SAVE_05 param', param)

        commonExecuteApi({ queryId: 'DATDA0010_SAVE_05', list: [param] }).then(res => {
          searchData()
          Message.success('댓글이 등록 되었습니다.')
        })
      }
    })
  } else if(btnId === 'btnUpdateReply') {
    // console.log('btn.item', btn.item)

    if(chkEmpty(btn.item.PASS_INPUT)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(sha256(btn.item.PASS_INPUT).toString() !== btn.item.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return
    } else if(chkEmpty(btn.item.CONTENT)) {
      Message.warn('내용을 입력해주세요.')
      return
    }

    vm.$swal({
      title: t(`댓글을 수정 하시겠습니까?`),
      showCancelButton: true,
    }).then(chk => {
      if (chk.isConfirmed) {
        const param = {}
        Object.keys(btn.item).forEach(key => {
          if(key.indexOf('_INPUT') < 0) {
            param[key] = btn.item[key]
          }
        })

        // console.log('DATDA0010_SAVE_05 param', param)

        commonExecuteApi({ queryId: 'DATDA0010_SAVE_05', list: [param] }).then(res => {
          searchData()
          Message.success('댓글이 수정되었습니다.')
        })
      }
    })
  }
}

const changeEmpYN = item => {
  if(item.EMP_YN === 'Y') {
    item.NICK_NAME = userStore.empNm

    vm.$swal({ title: t(`이 글은 실명으로 작성됩니다.\n익명으로 작성이 필요할 경우 ‘실명 작성’ 해제를 해 주시기 바랍니다.`), })
  } else {
    item.NICK_NAME = ''
  }
}

onMounted(() => {
  //
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="70%"
    height="100%"
  >
    <div class="title-bar">
      {{ $t(`${saveParams.NOTI_YN === 'Y' ? '공지' : '내용'} 보기`) }}
    </div>
    <v-card class="pa-3 fill-height" tabindex="-1">
      <v-card-title class="pa-0">
        <IGridTitle
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
          :use-permission="false"
        />
      </v-card-title>
      <v-card-text class="pa-0 content-area overflow-y-auto">
        <v-sheet class="d-flex flex-column fill-height">
          <div v-show="detailParam.GBN === 'A'" class="notice-item">
            {{ $t(`${saveParams.NOTI_YN === 'Y' ? '공지 내용' : '내용'}`) }}
          </div>
          <div v-show="detailParam.GBN === 'A'" class="pa-2 notice-content">
            <div class="d-flex justify-end align-center">
              <i-select
                v-show="saveParams.NOTI_YN === 'N' && isAdmin && saveParams.ANSWER_CNT < 1 && !saveParams.delNotice"
                v-model="saveParams.STATUS"
                :items="codeList.STATUS"
                item-value="COD"
                item-title="TXT"
                label=""
                width="150px"
                margin="0"
              />
              <v-btn
                v-show="saveParams.NOTI_YN === 'N' && isAdmin && saveParams.ANSWER_CNT < 1 && !saveParams.delNotice"
                @click="onButtonsClick({ id: 'btnChangeStatus' })"
              >
                접수상태변경
              </v-btn>
              <v-btn
                v-show="saveParams.NOTI_YN === 'N' && isAdmin && saveParams.ANSWER_CNT < 1 && !saveParams.delNotice"
                @click="onButtonsClick({ id: 'btnAnswer' })"
              >
                답변하기
              </v-btn>
              <v-btn
                 v-show="((saveParams.NOTI_YN === 'Y' && isAdmin) || saveParams.NOTI_YN === 'N') && !saveParams.delNotice"
                @click="onButtonsClick({ id: 'btnModify' })"
              >
                수정
              </v-btn>
              <v-btn
                v-show="saveParams.NOTI_YN === 'N' && !isAdmin && !saveParams.delNotice"
                @click="saveParams.PASS_INPUT = '', saveParams.delNotice = true"
              >
                삭제
              </v-btn>
              <v-btn
                v-show="isAdmin"
                @click="onButtonsClick({ id: 'btnDelete' })"
              >
                삭제
              </v-btn>
              <div v-show="saveParams.delNotice">
                <div class="d-flex align-center">
                  <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                    비밀번호
                  </div>
                  <div style="width: 215px;">
                    <v-text-field
                      v-model="saveParams.PASS_INPUT"
                      type="password"
                      :minlength="6"
                      :maxlength="20"
                      placeholder="비밀번호(6 ~ 20글자 입력)"
                      autocomplete="new-password"
                    />
                  </div>
                  <v-btn @click="onButtonsClick({ id: 'btnDelete' })">
                    삭제
                  </v-btn>
                  <v-btn @click="saveParams.delNotice = false">
                    취소
                  </v-btn>
                </div>
              </div>
            </div>
            <div class="content-title">
              {{ saveParams.TITLE2 }}
            </div>
            <div class="px-1 d-flex align-center">
              <div v-show="saveParams.NOTI_YN === 'N'" class="cnt__title">
                답글
              </div>
              <div v-show="saveParams.NOTI_YN === 'N'" class="cnt__data">
                {{ saveParams.ANSWER_CNT }}
              </div>
              <div class="cnt__title">
                조회수
              </div>
              <div class="cnt__data">
                {{ saveParams.SEARCH_CNT }}
              </div>
              <div class="cnt__title">
                공감
              </div>
              <div class="cnt__data">
                {{ saveParams.AGREE_CNT }}
              </div>
              <div class="btn-agree" @click="onButtonsClick({ id: 'btnAgree' })">
                <template v-if="saveParams.AGREE_YN === 'Y'">
                  <v-icon color="#ff5252">
                    mdi-heart
                  </v-icon>
                </template>
                <template v-else>
                  <v-icon>
                    mdi-heart-outline
                  </v-icon>
                </template>
                {{ '공감' }}
              </div>
              <div class="btn-agree" @click="onButtonsClick({ id: 'btnDisagree' })">
                <template v-if="saveParams.AGREE_YN === 'N'">
                  <v-icon color="#ff5252">
                    mdi-heart-broken
                  </v-icon>
                </template>
                <template v-else>
                  <v-icon>
                    mdi-heart-broken-outline
                  </v-icon>
                </template>
                {{ '비공감' }}
              </div>
            </div>
            <div class="px-3 pb-3 mt-2">
              <div>
                <div v-html="saveParams.CONTENT" style="min-height: 375px;" />
              </div>
              <div>
                <div class="mt-3 mb-1 pt-2" style="border-top: 1px solid #cccccc; font-size: 18px; font-weight: bold;">
                  첨부파일
                </div>
                <IUpload
                  class="file-list"
                  ref="fileUpload1"
                  fix-height
                  :chk-update="false"
                  grid-only
                  style="height: 165px"
                />
              </div>
              <div class="mt-3">
                <v-expansion-panels v-model="reply1">
                  <v-expansion-panel value="1" elevation="0" class="reply-panel">
                    <v-expansion-panel-title expand-icon="" collapse-icon="">
                      <template #default="{ expanded }">
                        <div>
                          <v-icon v-if="expanded">
                            mdi-chevron-up
                          </v-icon>
                          <v-icon v-else>
                            mdi-chevron-down
                          </v-icon>
                          {{ expanded ? '댓글 숨기기' : '댓글 보이기' }}
                        </div>
                      </template>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="pa-6">
                        <div class="d-flex justify-space-between align-center">
                          <div class="d-flex align-center">
                            <i-input
                              v-model="replyParams1.NICK_NAME"
                              :label="$t('별명')"
                              label-width="25px"
                              width="248px"
                              maxlength="20"
                              placeholder="별명(1 ~ 20글자 입력)"
                              :readonly="replyParams1.EMP_YN === 'Y'"
                            />
                            <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                              비밀번호
                            </div>
                            <div style="width: 215px;">
                              <v-text-field
                                v-model="replyParams1.PASS_INPUT"
                                type="password"
                                :minlength="6"
                                :maxlength="20"
                                placeholder="비밀번호(6 ~ 20글자 입력)"
                                autocomplete="new-password"
                              />
                            </div>
                            <div class="ml-5 mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                              비밀번호 확인
                            </div>
                            <div style="width: 215px;">
                              <v-text-field
                                v-model="replyParams1.PASS_OK_INPUT"
                                type="password"
                                :minlength="6"
                                :maxlength="20"
                                placeholder="비밀번호를 똑같이 입력해주세요."
                                autocomplete="new-password"
                              />
                            </div>
                            <v-checkbox
                              class="ml-5"
                              true-value="Y"
                              false-value="N"
                              v-model="replyParams1.EMP_YN"
                              label="실명 작성"
                              @update:model-value="changeEmpYN(replyParams1)"
                            />
                          </div>
                          <v-btn @click="onButtonsClick({ id: 'btnRegistReply1' })">
                            댓글등록
                          </v-btn>
                        </div>
                        <v-textarea v-model="replyParams1.CONTENT" class="mt-2" />
                        <div v-for="item in replyLists.NOTICE" :key="`notice-reply__${item.SEQ1}`" class="reply-item">
                          <div class="d-flex align-center">
                            <div v-show="item.SEQ2 !== 0" class="px-3">
                              <v-icon color="#777777">
                                mdi-arrow-right-bottom
                              </v-icon>
                            </div>
                            <div class="flex-grow-1">
                              <div class="item__header d-flex align-center">
                                <div v-show="!item.editable" class="header__nickname">
                                  {{ item.NICK_NAME }}
                                </div>
                                <div v-show="item.editable" style="width: 215px;">
                                  <v-text-field
                                    v-model="item.NICK_NAME"
                                    type="text"
                                    :maxlength="20"
                                    placeholder="별명(1 ~ 20글자 입력)"
                                    :readonly="item.EMP_YN === 'Y'"
                                  />
                                </div>
                                <v-checkbox
                                  v-show="item.editable"
                                  class="ml-5"
                                  true-value="Y"
                                  false-value="N"
                                  v-model="item.EMP_YN"
                                  label="실명 작성"
                                  @update:model-value="changeEmpYN(item)"
                                />
                                <div class="header__date">
                                  {{ item.INSERT_DATE }}
                                </div>
                                <v-btn
                                  v-show="item.SEQ2 === 0 && !item.editable && !item.delReply"
                                  class="header__btns"
                                  @click="Object.keys(item.subReplyFormOrg).forEach(key => { item.subReplyForm[key] = item.subReplyFormOrg[key] }), item.addReply = true"
                                >
                                  댓글
                                </v-btn>
                                <v-btn
                                  v-show="!item.editable && !item.delReply"
                                  class="header__btns"
                                  @click="item.PASS_INPUT = '', item.editable = true"
                                >
                                  수정
                                </v-btn>
                                <v-btn
                                  v-show="!isAdmin && !item.editable && !item.delReply"
                                  class="header__btns"
                                  @click="item.PASS_INPUT = '', item.delReply = true"
                                >
                                  삭제
                                </v-btn>
                                <v-btn
                                  v-show="isAdmin && !item.editable"
                                  class="header__btns"
                                  @click="onButtonsClick({ id: 'btnDeleteReply', item })"
                                >
                                  삭제
                                </v-btn>
                                <div v-show="item.delReply">
                                  <div class="d-flex align-center">
                                    <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                      비밀번호
                                    </div>
                                    <div style="width: 215px;">
                                      <v-text-field
                                        v-model="item.PASS_INPUT"
                                        type="password"
                                        :minlength="6"
                                        :maxlength="20"
                                        placeholder="비밀번호(6 ~ 20글자 입력)"
                                        autocomplete="new-password"
                                      />
                                    </div>
                                    <v-btn
                                      class="header__btns"
                                      @click="onButtonsClick({ id: 'btnDeleteReply', item })"
                                    >
                                      삭제
                                    </v-btn>
                                    <v-btn
                                      class="header__btns"
                                      @click="item.delReply = false"
                                    >
                                      취소
                                    </v-btn>
                                  </div>
                                </div>
                                <div v-show="item.editable">
                                  <div class="d-flex align-center">
                                    <div v-show="!isAdmin" class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                      비밀번호
                                    </div>
                                    <div v-show="!isAdmin" style="width: 215px;">
                                      <v-text-field
                                        v-model="item.PASS_INPUT"
                                        type="password"
                                        :minlength="6"
                                        :maxlength="20"
                                        placeholder="비밀번호(6 ~ 20글자 입력)"
                                        autocomplete="new-password"
                                      />
                                    </div>
                                    <v-btn
                                      class="header__btns"
                                      @click="onButtonsClick({ id: 'btnUpdateReply', item })"
                                    >
                                      저장
                                    </v-btn>
                                    <v-btn
                                      class="header__btns"
                                      @click="item.editable = false"
                                    >
                                      취소
                                    </v-btn>
                                  </div>
                                </div>
                              </div>
                              <div class="item__content d-flex align-center">
                                <div v-show="!item.editable" v-html="item.CONTENT_ORG.replace(/ /gi, '&nbsp;').replace(/\n/gi, '<br/>')" />
                                <v-textarea v-show="item.editable" v-model="item.CONTENT" />
                              </div>
                            </div>
                          </div>
                          <div v-show="item.addReply">
                            <div class="d-flex align-center mt-3">
                              <div class="px-3">
                                <v-icon color="#777777">
                                  mdi-arrow-right-bottom
                                </v-icon>
                              </div>
                              <div class="flex-grow-1">
                                <div class="d-flex justify-space-between align-center">
                                  <div class="d-flex align-center">
                                    <i-input
                                      v-model="item.subReplyForm.NICK_NAME"
                                      :label="$t('별명')"
                                      label-width="25px"
                                      width="248px"
                                      maxlength="20"
                                      placeholder="별명(1 ~ 20글자 입력)"
                                      :readonly="item.subReplyForm.EMP_YN === 'Y'"
                                    />
                                    <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                      비밀번호
                                    </div>
                                    <div style="width: 215px;">
                                      <v-text-field
                                        v-model="item.subReplyForm.PASS_INPUT"
                                        type="password"
                                        :minlength="6"
                                        :maxlength="20"
                                        placeholder="비밀번호(6 ~ 20글자 입력)"
                                        autocomplete="new-password"
                                      />
                                    </div>
                                    <div class="ml-5 mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                      비밀번호 확인
                                    </div>
                                    <div style="width: 215px;">
                                      <v-text-field
                                        v-model="item.subReplyForm.PASS_OK_INPUT"
                                        type="password"
                                        :minlength="6"
                                        :maxlength="20"
                                        placeholder="비밀번호를 똑같이 입력해주세요."
                                        autocomplete="new-password"
                                      />
                                    </div>
                                    <v-checkbox
                                      class="ml-5"
                                      true-value="Y"
                                      false-value="N"
                                      v-model="item.subReplyForm.EMP_YN"
                                      label="실명 작성"
                                      @update:model-value="changeEmpYN(item.subReplyForm)"
                                    />
                                  </div>
                                  <div class="d-flex align-center">
                                    <v-btn @click="onButtonsClick({ id: 'btnRegistSubReply', item: item.subReplyForm })">
                                      댓글등록
                                    </v-btn>
                                    <v-btn @click="item.addReply = false">
                                      취소
                                    </v-btn>
                                  </div>
                                </div>
                                <v-textarea v-model="item.subReplyForm.CONTENT" class="mt-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </div>
          </div>
          <div v-show="saveParams.ANSWER_CNT > 0" :class="`notice-answer gbn-${detailParam.GBN}`">
            <div class="mt-3 notice-item">
              답변
            </div>
            <div class="pa-2 notice-content">
              <div class="d-flex justify-end align-center">
                <v-btn
                  v-show="isAdmin"
                  @click="onButtonsClick2({ id: 'btnModify' })"
                >
                  수정
                </v-btn>
                <v-btn
                  v-show="isAdmin"
                  @click="onButtonsClick2({ id: 'btnDelete' })"
                >
                  삭제
                </v-btn>
                <!-- <v-btn
                  v-show="!answerParams.delAnswer"
                  @click="onButtonsClick2({ id: 'btnModify' })"
                >
                  수정
                </v-btn>
                <v-btn
                  v-show="!answerParams.delAnswer"
                  @click="answerParams.PASS_INPUT = '', answerParams.delAnswer = true"
                >
                  삭제
                </v-btn>
                <div v-show="answerParams.delAnswer">
                  <div class="d-flex align-center">
                    <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                      비밀번호
                    </div>
                    <div style="width: 215px;">
                      <v-text-field
                        v-model="answerParams.PASS_INPUT"
                        type="password"
                        :minlength="6"
                        :maxlength="20"
                        placeholder="비밀번호(6 ~ 20글자 입력)"
                        autocomplete="new-password"
                      />
                    </div>
                    <v-btn @click="onButtonsClick2({ id: 'btnDelete' })">
                      삭제
                    </v-btn>
                    <v-btn @click="answerParams.delAnswer = false">
                      취소
                    </v-btn>
                  </div>
                </div> -->
              </div>
              <div class="content-title">
                {{ answerParams.TITLE }}
              </div>
              <div class="px-1 d-flex align-center">
                <div class="cnt__title">
                  조회수
                </div>
                <div class="cnt__data">
                  {{ answerParams.SEARCH_CNT }}
                </div>
                <div class="cnt__title">
                  공감
                </div>
                <div class="cnt__data">
                  {{ answerParams.AGREE_CNT }}
                </div>
                <div class="btn-agree" @click="onButtonsClick2({ id: 'btnAgree' })">
                  <template v-if="answerParams.AGREE_YN === 'Y'">
                    <v-icon color="#ff5252">
                      mdi-heart
                    </v-icon>
                  </template>
                  <template v-else>
                    <v-icon>
                      mdi-heart-outline
                    </v-icon>
                  </template>
                  {{ '공감' }}
                </div>
                <div class="btn-agree" @click="onButtonsClick2({ id: 'btnDisagree' })">
                  <template v-if="answerParams.AGREE_YN === 'N'">
                    <v-icon color="#ff5252">
                      mdi-heart-broken
                    </v-icon>
                  </template>
                  <template v-else>
                    <v-icon>
                      mdi-heart-broken-outline
                    </v-icon>
                  </template>
                  {{ '비공감' }}
                </div>
              </div>
              <div class="px-3 pb-3 mt-2">
                <div>
                  <div v-html="answerParams.CONTENT" style="min-height: 375px;" />
                </div>
                <div>
                  <div class="mt-3 mb-1 pt-2" style="border-top: 1px solid #cccccc; font-size: 18px; font-weight: bold;">
                    첨부파일
                  </div>
                  <IUpload
                    class="file-list"
                    ref="fileUpload2"
                    fix-height
                    :chk-update="false"
                    grid-only
                    style="height: 165px"
                  />
                </div>
                <div class="mt-3">
                  <v-expansion-panels v-model="reply2">
                    <v-expansion-panel value="1" elevation="0" class="reply-panel">
                      <v-expansion-panel-title expand-icon="" collapse-icon="">
                        <template #default="{ expanded }">
                          <div>
                            <v-icon v-if="expanded">
                              mdi-chevron-up
                            </v-icon>
                            <v-icon v-else>
                              mdi-chevron-down
                            </v-icon>
                            {{ expanded ? '댓글 숨기기' : '댓글 보이기' }}
                          </div>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div class="pa-6">
                          <div class="d-flex justify-space-between align-center">
                            <div class="d-flex align-center">
                              <i-input
                                v-model="replyParams2.NICK_NAME"
                                :label="$t('별명')"
                                label-width="25px"
                                width="248px"
                                maxlength="20"
                                placeholder="별명(1 ~ 20글자 입력)"
                                :readonly="replyParams2.EMP_YN === 'Y'"
                              />
                              <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                비밀번호
                              </div>
                              <div style="width: 215px;">
                                <v-text-field
                                  v-model="replyParams2.PASS_INPUT"
                                  type="password"
                                  :minlength="6"
                                  :maxlength="20"
                                  placeholder="비밀번호(6 ~ 20글자 입력)"
                                  autocomplete="new-password"
                                />
                              </div>
                              <div class="ml-5 mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                비밀번호 확인
                              </div>
                              <div style="width: 215px;">
                                <v-text-field
                                  v-model="replyParams2.PASS_OK_INPUT"
                                  type="password"
                                  :minlength="6"
                                  :maxlength="20"
                                  placeholder="비밀번호를 똑같이 입력해주세요."
                                  autocomplete="new-password"
                                />
                              </div>
                              <v-checkbox
                                class="ml-5"
                                true-value="Y"
                                false-value="N"
                                v-model="replyParams2.EMP_YN"
                                label="실명 작성"
                                @update:model-value="changeEmpYN(replyParams2)"
                              />
                            </div>
                            <v-btn @click="onButtonsClick2({ id: 'btnRegistReply2' })">
                              댓글등록
                            </v-btn>
                          </div>
                          <v-textarea v-model="replyParams2.CONTENT" class="mt-2" />
                          <div v-for="item in replyLists.ANSWER" :key="`answer-reply__${item.SEQ1}`" class="reply-item">
                            <div class="d-flex align-center">
                              <div v-show="item.SEQ2 !== 0" class="px-3">
                                <v-icon color="#777777">
                                  mdi-arrow-right-bottom
                                </v-icon>
                              </div>
                              <div class="flex-grow-1">
                                <div class="item__header d-flex align-center">
                                  <div v-show="!item.editable" class="header__nickname">
                                    {{ item.NICK_NAME }}
                                  </div>
                                  <div v-show="item.editable" style="width: 215px;">
                                    <v-text-field
                                      v-model="item.NICK_NAME"
                                      type="text"
                                      :maxlength="20"
                                      placeholder="별명(1 ~ 20글자 입력)"
                                      :readonly="item.EMP_YN === 'Y'"
                                    />
                                  </div>
                                  <v-checkbox
                                    v-show="item.editable"
                                    class="ml-5"
                                    true-value="Y"
                                    false-value="N"
                                    v-model="item.EMP_YN"
                                    label="실명 작성"
                                    @update:model-value="changeEmpYN(item)"
                                  />
                                  <div class="header__date">
                                    {{ item.INSERT_DATE }}
                                  </div>
                                  <v-btn
                                    v-show="item.SEQ2 === 0 && !item.editable && !item.delReply"
                                    class="header__btns"
                                    @click="Object.keys(item.subReplyFormOrg).forEach(key => { item.subReplyForm[key] = item.subReplyFormOrg[key] }), item.addReply = true"
                                  >
                                    댓글
                                  </v-btn>
                                  <v-btn
                                    v-show="!item.editable && !item.delReply"
                                    class="header__btns"
                                    @click="item.PASS_INPUT = '', item.editable = true"
                                  >
                                    수정
                                  </v-btn>
                                  <v-btn
                                    v-show="!isAdmin && !item.editable && !item.delReply"
                                    class="header__btns"
                                    @click="item.PASS_INPUT = '', item.delReply = true"
                                  >
                                    삭제
                                  </v-btn>
                                  <v-btn
                                    v-show="isAdmin && !item.editable"
                                    class="header__btns"
                                    @click="onButtonsClick({ id: 'btnDeleteReply', item })"
                                  >
                                    삭제
                                  </v-btn>
                                  <div v-show="item.delReply">
                                    <div class="d-flex align-center">
                                      <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                        비밀번호
                                      </div>
                                      <div style="width: 215px;">
                                        <v-text-field
                                          v-model="item.PASS_INPUT"
                                          type="password"
                                          :minlength="6"
                                          :maxlength="20"
                                          placeholder="비밀번호(6 ~ 20글자 입력)"
                                          autocomplete="new-password"
                                        />
                                      </div>
                                      <v-btn
                                        class="header__btns"
                                        @click="onButtonsClick({ id: 'btnDeleteReply', item })"
                                      >
                                        삭제
                                      </v-btn>
                                      <v-btn
                                        class="header__btns"
                                        @click="item.delReply = false"
                                      >
                                        취소
                                      </v-btn>
                                    </div>
                                  </div>
                                  <div v-show="item.editable">
                                    <div class="d-flex align-center">
                                      <div v-show="!isAdmin" class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                        비밀번호
                                      </div>
                                      <div v-show="!isAdmin" style="width: 215px;">
                                        <v-text-field
                                          v-model="item.PASS_INPUT"
                                          type="password"
                                          :minlength="6"
                                          :maxlength="20"
                                          placeholder="비밀번호(6 ~ 20글자 입력)"
                                          autocomplete="new-password"
                                        />
                                      </div>
                                      <v-btn
                                        class="header__btns"
                                        @click="onButtonsClick({ id: 'btnUpdateReply', item })"
                                      >
                                        저장
                                      </v-btn>
                                      <v-btn
                                        class="header__btns"
                                        @click="item.editable = false"
                                      >
                                        취소
                                      </v-btn>
                                    </div>
                                  </div>
                                </div>
                                <div class="item__content d-flex align-center">
                                  <div v-show="!item.editable" v-html="item.CONTENT_ORG.replace(/ /gi, '&nbsp;').replace(/\n/gi, '<br/>')" />
                                  <v-textarea v-show="item.editable" v-model="item.CONTENT" />
                                </div>
                              </div>
                            </div>
                            <div v-show="item.addReply">
                              <div class="d-flex align-center mt-3">
                                <div class="px-3">
                                  <v-icon color="#777777">
                                    mdi-arrow-right-bottom
                                  </v-icon>
                                </div>
                                <div class="flex-grow-1">
                                  <div class="d-flex justify-space-between align-center">
                                    <div class="d-flex align-center">
                                      <i-input
                                        v-model="item.subReplyForm.NICK_NAME"
                                        :label="$t('별명')"
                                        label-width="25px"
                                        width="248px"
                                        maxlength="20"
                                        placeholder="별명(1 ~ 20글자 입력)"
                                        :readonly="item.subReplyForm.EMP_YN === 'Y'"
                                      />
                                      <div class="mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                        비밀번호
                                      </div>
                                      <div style="width: 215px;">
                                        <v-text-field
                                          v-model="item.subReplyForm.PASS_INPUT"
                                          type="password"
                                          :minlength="6"
                                          :maxlength="20"
                                          placeholder="비밀번호(6 ~ 20글자 입력)"
                                          autocomplete="new-password"
                                        />
                                      </div>
                                      <div class="ml-5 mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                                        비밀번호 확인
                                      </div>
                                      <div style="width: 215px;">
                                        <v-text-field
                                          v-model="item.subReplyForm.PASS_OK_INPUT"
                                          type="password"
                                          :minlength="6"
                                          :maxlength="20"
                                          placeholder="비밀번호를 똑같이 입력해주세요."
                                          autocomplete="new-password"
                                        />
                                      </div>
                                      <v-checkbox
                                        class="ml-5"
                                        true-value="Y"
                                        false-value="N"
                                        v-model="item.subReplyForm.EMP_YN"
                                        label="실명 작성"
                                        @update:model-value="changeEmpYN(item.subReplyForm)"
                                      />
                                    </div>
                                    <div class="d-flex align-center">
                                      <v-btn @click="onButtonsClick({ id: 'btnRegistSubReply', item: item.subReplyForm })">
                                        댓글등록
                                      </v-btn>
                                      <v-btn @click="item.addReply = false">
                                        취소
                                      </v-btn>
                                    </div>
                                  </div>
                                  <v-textarea v-model="item.subReplyForm.CONTENT" class="mt-2" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
              </div>
            </div>
          </div>
        </v-sheet>
      </v-card-text>

      <DATDA0010Popup02 ref="popUpdate" @saved="searchData(), emit('saved')" ck-editor-id="ck-editor__modify" />
      <DATDA0010Popup04 ref="popAnswer" @saved="searchData(), emit('saved')" ck-editor-id="ck-editor__answer" />
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.notice-item {
  font-size: 32px;
  font-weight: bold;
  color: #154295;
  padding: 0 8px 4px 8px;
  border-bottom: 2px solid #000000;
}

.notice-answer.gbn-A {
  border-top: 1px solid #cccccc;
}

.content-title {
  font-size: 20px;
  font-weight: bold;
  color: #222222;
  padding: 0 4px 8px 4px;
  margin-bottom: 8px;
  border-bottom: 1px solid #cccccc;
}

.btn-agree {
  font-size: 14px;
  padding: 5px 10px;
  border: 1px solid #222222;
  border-radius: 4px;
  cursor: pointer;
}

.btn-agree:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.btn-agree:not(:first-child) {
  margin-left: 4px;
}

.cnt__title {
  margin-right: 8px;
}

.cnt__data {
  font-weight: bold;
  margin-right: 28px;
}

.file-list {
  padding: 0 !important;
}

.v-expansion-panel {
  border: 1px solid #dddddd;
  
  .v-expansion-panel-title {
    background-color: #f9f9f9;
  }

  .v-expansion-panel-text {
    border-top: 1px solid #dddddd;
  }
}

.reply-item {
  padding: 12px 4px;
  border-bottom: 1px solid #dddddd;

  .item__header {
    padding-bottom: 4px;
    font-size: 14px;
    color: #777777;
  }

  .header__nickname {
    padding-right: 16px;
    border-right: 1px solid #dddddd;
    font-weight: bold;
  }

  .header__date {
    padding: 0 16px;
  }

  .header__btns {
    background-color: #eeeeee !important;
    color: #222222 !important;
    border: 1px solid #dddddd;
  }

  .header__btns:hover {
    background-color: rgba(0, 0, 0, 0.3) !important;
  }

  .item__content {
    font-size: 14px;
    color: #222222;
  }
}
</style>