import { MemberAvatar } from "@/components/member-avatar";
import { ImageUploadField } from "@/components/image-upload-field";

type AccountAvatarFieldProps = {
  name: string;
  defaultValue?: string;
  userId: string;
  displayName: string;
};

export function AccountAvatarField({
  name,
  defaultValue = "",
  userId,
  displayName,
}: AccountAvatarFieldProps) {
  return (
    <div className="form-field form-field-wide">
      <span className="form-label-row">
        <span>头像</span>
      </span>

      <ImageUploadField
        name={name}
        defaultValue={defaultValue}
        uploadTarget={{
          kind: "member-avatar",
          userId,
        }}
        mode="upload-only"
        appearance="site"
        uploadLabel="上传头像"
        clearLabel="恢复默认头像"
        panelTitle="上传头像"
        panelDescription="支持直接上传图片。上传后会自动保存到社区存储，不需要再填写头像链接。"
        filledStatusText="已设置头像"
        emptyStatusText="当前为默认缩写头像"
        preview={(value) => <MemberAvatar name={displayName} avatarUrl={value} />}
      />
    </div>
  );
}
