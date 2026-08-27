import { commonExcelDownApi } from "@hiway/api/commonApi"

/**
 * @param {Object} columnName 엑셀에 생성할 0번째 로우 제목입니다.
 * @param {Object} searchParam 조회조건객체 입니다.
 * @param {String} queryId 쿼리 아이디 입니다.
 * @param {String} sheetName 생성할 엑셀시트 이름입니다.
 * @param {String} fileName 생성할 파일이름입니다.(한글x)
 */
export function excelDown(
  columnName,
  searchParam,
  queryId,
  sheetName,
  fileName
) {
  let excelParam = [{}, {}, {}, {}]
  excelParam[0] = { ...columnName }
  excelParam[1] = { ...searchParam }
  excelParam[2].sheetName = sheetName
  excelParam[3].fileName = fileName
  commonExcelDownApi({ queryId: queryId, param: excelParam }).then((res) => {
    //console.log('res : ',res)
    // 2024.08.07 박용훈 한글 파일명 다운로드 되도록 개선

    // const fileName = res.contentDisposition.split("filename=")[1].split(".")[0]
    // const blob = new Blob([res], { type: res.type })
    // const link = document.createElement("a")
    // link.href = URL.createObjectURL(blob)
    // link.download = fileName
    // link.click()
    // URL.revokeObjectURL(link.href)

    // 헤더에서 파일명 추출
    const contentDisposition = res.contentDisposition;
     
    let fileName = 'default.xlsx';  // 기본 파일명
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = decodeURIComponent(fileNameMatch[1]);
      }
    }
    // 파일 다운로드
    const blob = new Blob([res], { type: res.type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);

  }).catch((error) => {
    console.error('Download error:', error);
  })
}
/*엑셀 다운로드 사용법
src\pages\00_sample\SampleGrid2_3.vue 파일 참고

columnName파라미터 예시
name = {
    '사업장구분' : "CMPNY_DIV",
    '자걱사번' : "EMP_NO"
    ... 형태로 적어서 넣으면됨
}

searchParam파라미터 예시
각자 화면에서 조회조건 객체를 넣으면됨
ex)
searchparam= {
    EMP_NO:'',
    CMPNY_DIV:''
}형태로 선언된 객체를 넣으면됨

queryId는 조회할 쿼리아이디를 넣으면됨
엑셀에 조회된 데이터가 입력되어서 파일로 나옴

sheetName은 엑셀 시트이름임
string형태로 넣으면 됨

fileName은 생성될 파일이름
*/


function fixdata(data) {
  var o = "", l = 0, w = 10240
  for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)))
  o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)))
  return o;
}

export function getJsonFromExcel(file, callback, startRowIndex = 0) {
// 2025-05-19 김동건 선임
// excel 시작 row : startRowIndex 추가

  var reader = new FileReader()
  var name = file.name

  reader.onload = function (e) {
    let data = e.target.result

    //var workbook = XLSX.read(data, { type: 'binary' });
    let arr = fixdata(data)
    let workbook = XLSX.read(btoa(arr), { type: "base64", cellText: true, cellDates: true })
    
    let sheets = {}
    workbook.SheetNames.forEach(function (sheetName) {
      // 2025-05-19 김동건 선임
      // range: startRowIndex 추가
      let roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {rawNumbers: true, range: startRowIndex})

        if (roa.length > 0) {
          sheets[sheetName] = roa
        }
    })

    let sheetNames = Object.keys(sheets)

    if (sheetNames.length > 0) {
      let jsonData = sheets[sheetNames[0]]

      if (jsonData) {
        callback(jsonData)
      }
    }
  }

  reader.readAsArrayBuffer(file)
}