import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"

export default class saveFlowHelper {
  constructor(view, t) {
    this.vm = view //컨펌메세지
    // validation 대상 grid, row
    // ex) [{grid: grdMain, row: "check"}]
    // row 값 : "check", "focus", "all" = null
    this.targetGridRow = []
    this.gridList = [] //재조회시 수정여부 확인 안하도록 상태 변경 그리드
    this.saveForm = null //Form 저장일경우, 저장조건 validation 확인
    this.useDefaultBefore = true //실행전 디폴트 사용여부
    this.messageYn = true //디폴트 결과 메세지 사용여부
    this.toastYn = true
    this.resultMessage = "저장 되었습니다." //확인 메세지
    this.confirmMessage = "저장 하시겠습니까?" //확인 메세지
    this.userBefore = null //실행전 사용자정의 체크함수
    this.userAfter = null //실행후 사용자정의 체크함수
    this.query = Function //저장함수
    this.t = t //다국어
  }

  //기본 validation 확인용 그리드 셋팅
  setTargetGridRow = (arrGrid) => {
    this.targetGridRow = [...arrGrid]

    return this
  }

  //조회시 수정중 데이터 확인용 그리드 셋팅
  setGridList = (arrGrid) => {
    this.gridList = [...arrGrid]

    return this
  }

  //Form 저장일경우, 저장조건 validation 확인용 그리드 셋팅
  setSaveForm = (saveForm) => {
    this.saveForm = saveForm

    return this
  }

  //실행전 사용자정의 체크함수 셋팅
  setBefore = (action) => {
    this.userBefore = action

    return this
  }

  //실행함수 셋팅
  setQuery = (action, param = null) => {
    this.query = () => {
      return action(param)
    }

    return this
  }

  //조회전 사용자정의 체크함수 셋팅
  setAfter = (action) => {
    this.userAfter = action

    return this
  }

  //확인 메세지 변경하고 싶을 때
  setConfirmMessage = (message) => {
    this.confirmMessage = message

    return this
  }

  //결과 메세지 변경하고 싶을 때
  setResultMessage = (message) => {
    this.resultMessage = message

    return this
  }

  showMessage = (useYn) => {
    this.messageYn = useYn //저장전 메세지 사용여부

    return this
  }

  showToast = (useYn) => {
    this.toastYn = useYn // 하단 알림창 사용 여부

    return this
  }

  setUseDefaultBefore = (useYn) => {
    this.useDefaultBefore = useYn //조회전 디폴트 사용여부

    return this
  }

  //실행전 디폴트 체크
  defaultBeforeSave = async () => {
    if (this.saveForm) {
      let isValidate = { valid: true }

      if (this.saveForm) {
        isValidate = await this.saveForm.value.validate()
      }

      if (!isValidate.valid) {
        Message.warn(this.t("저장 조건을 확인하세요"))
        return false
      }
    }

    //그리드 데이터 validation 확인
    for (const target of this.targetGridRow) {
      target.grid.value.getGridView().commit(true)

      let rows = null

      if (target.row == "check") {
        rows = target.grid.value.getGridView().getCheckedItems()
      } else if (target.row == "focus") {
        rows = [target.grid.value.getGridView().getCurrent().itemIndex]
      } else {
        let cnt = target.grid.value.getDataProvider().getRowCount()
        rows = [...Array(cnt)].map((_, index) => 0 + index)
      }

      if (!rows || rows.length == 0) {
        Message.warn(this.t("저장할 데이터가 없습니다."))

        return false
      }

      //target.grid.value.getGridView().validateCells(null, false)

      for (const row of rows) {
        target.grid.value.getGridView().validateCells(row, false)
        var validated = target.grid.value.getGridView().getInvalidCells(row)

        if (validated) {
          Message.warn(this.t("입력값이 올바르지 않습니다."))

          return false
        }
      }
    }

    return true
  }

  run = async () => {
    //디폴트 체크 (데이터 변경여부, 조회조건 validation)
    if (this.useDefaultBefore) {
      if (!(await this.defaultBeforeSave())) {
        return
      }
    }

    // 사용자정의 validation
    if (this.userBefore) {
      if (!(await this.userBefore())) {
        return
      }
    }

    // 실행전 컨펌
    if (this.messageYn) {
      //2024.04.26 김현재작성 messageYn false주면 저장하시겠습니까? 창 안뜨도록 수정
      let res = await this.vm.$swal({
        title: this.t(this.confirmMessage),
        showCancelButton: true,
        focusConfirm: true,
        didOpen: () => {
          const confirmButton = this.vm.$swal.getConfirmButton?.();
          if (confirmButton) confirmButton.focus(); // ✅ 수동 포커스
        }
      })

      if (!res.isConfirmed) {
        return
      }
    }

    this.query()
      .then((res) => {
        //모든 행의 상태를 None 로 초기화
        for (const grid of this.gridList) {
          //grid.value.getGridView().cancel()
          grid.value.getDataProvider().clearRowStates(true, false)
        }

        if (this.messageYn && this.toastYn) {
          Message.success(this.t(this.resultMessage))
        }

        //사용자 정의 after 실행함수
        if (this.userAfter) {
          this.userAfter(res)
        }
      })
      .catch((err) => {
        //Message.err(err)
      })
      .finally(() => {
        // console.log("finally")
      })
  }
}
