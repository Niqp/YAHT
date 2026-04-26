#import "YAHTNativeReminderStorage.h"

#import <Foundation/Foundation.h>
#import <MMKV/MMKV.h>

@implementation YAHTNativeReminderStorage

+ (void)ensureMMKVInitialized
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSArray<NSString *> *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentPath = paths.firstObject;
    NSString *basePath = documentPath.length > 0 ? [documentPath stringByAppendingPathComponent:@"mmkv"] : nil;
    if (basePath.length > 0) {
      MMKV::initializeMMKV(std::string(basePath.UTF8String));
    } else {
      MMKV::initializeMMKV("");
    }
  });
}

+ (MMKV *)storageForId:(NSString *)storageId
{
  [self ensureMMKVInitialized];
  if ([storageId isEqualToString:@"mmkv.default"]) {
    return MMKV::defaultMMKV();
  }

  return MMKV::mmkvWithID(std::string(storageId.UTF8String));
}

+ (nullable NSString *)stringForStorageId:(NSString *)storageId key:(NSString *)key
{
  MMKV *storage = [self storageForId:storageId];
  if (storage == nullptr) {
    return nil;
  }

  std::string value;
  bool hasValue = storage->getString(std::string(key.UTF8String), value);
  if (!hasValue) {
    return nil;
  }

  return [NSString stringWithUTF8String:value.c_str()];
}

+ (BOOL)setString:(NSString *)value storageId:(NSString *)storageId key:(NSString *)key
{
  MMKV *storage = [self storageForId:storageId];
  if (storage == nullptr) {
    return NO;
  }

  return storage->set(std::string(value.UTF8String), std::string(key.UTF8String));
}

+ (void)removeValueForStorageId:(NSString *)storageId key:(NSString *)key
{
  MMKV *storage = [self storageForId:storageId];
  if (storage == nullptr) {
    return;
  }

  storage->removeValueForKey(std::string(key.UTF8String));
}

@end
