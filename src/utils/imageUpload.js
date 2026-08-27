// https://hiway.hhigroup.kr/#/guide?page_id=PG00062 참고
// import { uploadImage } from '@/api/board/editor' // 개발자가 작성한 API로 수정해주세요


export default class ImageUpload {
  loader
  constructor(loader) {
    this.loader = loader
  }
  upload() {
    return this.loader.file.then(
      file =>
        new Promise((resolve, reject) => {
          // eslint-disable-next-line promise/no-nesting
          uploadImage(file).then((res) => {
			console.log('서버에 저장된 이미지 : ' + res)
			// uploadImage 실행 후 저장된 이미지를 return 하여 에디터의 img 태그에 해당 파일의 주소를 넣습니다.
			resolve({
				default: 'ex) http://fileGetApi/' + res.file_guid // 서버에 저장된 이미지를 호출할 수 있는 api를 작성합니다.
			})
		  })
		  .catch(message => {
            console.log(message, 'error')
          })
        }),
    )
  }
}
