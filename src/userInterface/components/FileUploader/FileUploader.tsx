import React, { useState } from 'react';
import Button from 'antd/es/button';
import message from 'antd/es/message';
import Upload from 'antd/lib/upload';
import { UploadFile } from 'antd/lib/upload/interface';

export const FileUploader: React.FC<{ onUpload: (file?: UploadFile | undefined) => void, onRemove: () => void  }> = (props) => {
    const [fileList, setFileList] = useState<UploadFile<any>[] | undefined>(undefined);
    // let fileList: UploadFile<any>[] | undefined = undefined;

    const settings = {
        name: 'file',
        // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
            authorization: 'authorization-text',
        },
        fileList: fileList,
        maxCount: 1,
        onChange(info: any) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
                // set to new config
                props.onUpload(info.fileList.slice(-1)[0]);
            }
            else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
            if (info.file.status === 'removed') {
                props.onRemove();
                //set to default config
            }

            // Limit the number of uploaded files
            // Only show latest uploaded file, and old ones will be replaced by the new
            setFileList(info.fileList.slice(-1));
        }
    };

    return (
        <Upload {...settings}>
            <Button icon='upload'>{props.children}</Button>
        </Upload>
    )
}