export type ImageItem =
| {
    type: 'existing';
    id: string;
    url: string;
}
| {
    type: 'new';
    file: File;
    preview: string;
};